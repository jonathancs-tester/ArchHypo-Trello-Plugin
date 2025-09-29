import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Pinecone } from "@pinecone-database/pinecone";
import { cleanAndParseJSON } from './utils/json-utils.js';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

// --- Parser JSON ---
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "Names of select the most appropriate ArchHypo pattern",
  reason: "Reason for the choice.",
});

// --- Inicializa Pinecone ---
async function getPineconeClient() {
  return new Pinecone({ apiKey: PINECONE_API_KEY });
}

async function embedText(text) {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          model: "gemini-embedding-001",
          content: {
            parts: [{ text }]
          }
        })
      }
    );

    const data = await res.json();

    if (!data.embedding || !Array.isArray(data.embedding.values)) {
      console.error("❌ Embedding não retornado corretamente:", data);
      return [];
    }

    return data.embedding.values;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    return [];
  }
}

// --- Consulta Pinecone com filtro opcional ---
async function queryPinecone(hypothesis, topK = 20, patternCandidates = []) {
  const vector = await embedText(hypothesis);
  
  if (!vector || !Array.isArray(vector) || vector.length === 0) {
    console.warn("Embedding inválido ou vazio. Consulta ao Pinecone abortada.");
    return [];
  }

  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  const queryParams = {
    vector,
    topK,
    includeMetadata: true
  };

  if (patternCandidates.length > 0) {
    queryParams.filter = {
      patternName: { $in: patternCandidates }
    };
  }

  const queryResponse = await index.query(queryParams);
  const matches = queryResponse.matches || [];
  return matches.map(m => m.metadata.text);
}

// --- Classificação com LLM ---
async function classifyPattern(hypothesis, patternCandidates = [], language = 'pt') {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: API_KEY,
    verbose: true
  });

  const relevantDocs = await queryPinecone(hypothesis, 20, patternCandidates);
  const context = relevantDocs.length > 0
    ? relevantDocs.join("\n\n---\n\n")
    : "Nenhum documento relevante encontrado.";

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = `You are a Senior Software Architect, specialized in methodologies for validating architectural hypotheses.

**Objective:**
Your task is to analyze the **Hypothesis** and the **Document Content** provided. Based on this analysis, you must select the **single** "ArchHypo" pattern from that best applies to validate, investigate, or resolve the hypothesis.

**Analysis Instructions:**
1.  Carefully read the **Hypothesis**. This is your main focus.
2.  Use the **Document Content** as supporting evidence to understand the hypothesis context.
3.  Compare the hypothesis intent with the definitions of the 12 "ArchHypo" patterns listed above.
4.  Select the **single pattern** that best represents the approach for the situation.
5.  If **none** of the patterns clearly apply, the value of the "pattern" key should be "N/A".
6.  Justify your choice in 2 sentences, connecting the hypothesis with the definition of the chosen pattern.

Respond in **${idiomaTexto}** with valid JSON:
${parser.getFormatInstructions()}

Hypothesis:
"${hypothesis}"

Document content:
${context}
`;

  const response = await llm.invoke(prompt);
  const rawOutput = response.text || response.candidates?.[0]?.content || '';

  try {
    const parsed = cleanAndParseJSON(rawOutput);
    console.log("✅ JSON válido recebido do LLM:", parsed);
    return parsed;
  } catch (error) {
    console.error("❌ Erro ao parsear JSON:", rawOutput);
    throw error;
  }

}

// --- Métricas de avaliação ---
function precisionAtK(retrieved, relevant, k) {
  const topK = retrieved.slice(0, k);
  const relevantSet = new Set(relevant);
  const hits = topK.filter(doc => relevantSet.has(doc));
  return hits.length / k;
}

function hitRate(retrieved, relevant) {
  const relevantSet = new Set(relevant);
  const hits = retrieved.filter(doc => relevantSet.has(doc));
  return hits.length / relevant.length;
}

function meanReciprocalRank(retrieved, relevant) {
  const relevantSet = new Set(relevant);
  for (let i = 0; i < retrieved.length; i++) {
    if (relevantSet.has(retrieved[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

function relevanceScore(hypothesis, retrieved) {
  const terms = hypothesis.toLowerCase().split(/\W+/).filter(t => t.length > 3);
  const scores = retrieved.map(doc => {
    const docLower = doc.toLowerCase();
    const count = terms.filter(term => docLower.includes(term)).length;
    return count / terms.length;
  });
  return scores.reduce((sum, val) => sum + val, 0) / scores.length;
}

async function factualConsistencyScore(text, documents) {
  const textEmbedding = await embedText(text);

  if (!Array.isArray(textEmbedding) || textEmbedding.length === 0) {
    console.warn("Embedding do texto está vazio ou inválido.");
    return null;
  }

  const docEmbeddings = await Promise.all(documents.map(async (doc, i) => {
    const emb = await embedText(doc);
    if (!Array.isArray(emb) || emb.length === 0) {
      console.warn(`Embedding do documento ${i} está vazio ou inválido.`);
    }
    return emb;
  }));

  const validEmbeddings = docEmbeddings.filter(e => Array.isArray(e) && e.length > 0);

  if (validEmbeddings.length === 0) {
    console.warn("Nenhum embedding válido nos documentos.");
    return null;
  }

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return normA && normB ? dot / (normA * normB) : 0;
  };

  const scores = validEmbeddings.map(docEmb => cosineSimilarity(textEmbedding, docEmb));
  const avgScore = scores.reduce((sum, val) => sum + val, 0) / scores.length;

  return isFinite(avgScore) ? avgScore : null;
}

// --- Netlify Function handler ---
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Use POST.' }) };
  }

  try {
    const { hypothesis, patternCandidates = [], language = 'pt' } = JSON.parse(event.body);
    if (!hypothesis) return { statusCode: 400, body: JSON.stringify({ error: 'Missing hypothesis.' }) };

    const result = await classifyPattern(hypothesis, patternCandidates, language);
    const retrievedDocs = await queryPinecone(hypothesis, 20, patternCandidates);
    const relevantDocs = retrievedDocs;

    const evaluation = {
      precisionAt5: precisionAtK(retrievedDocs, relevantDocs, 5),
      hitRate: hitRate(retrievedDocs, relevantDocs),
      mrr: meanReciprocalRank(retrievedDocs, relevantDocs),
      factualConsistencyScore: await factualConsistencyScore(result.pattern, retrievedDocs),
      relevanceScore: relevanceScore(hypothesis, retrievedDocs)
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        pattern: result.pattern,
        reason: result.reason,
        evaluation
      })
    };

  } catch (error) {
    console.error("Erro na função handler:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
