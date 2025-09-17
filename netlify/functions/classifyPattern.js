import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Pinecone } from "@pinecone-database/pinecone";
import { franc } from 'franc';

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

// --- Gera embeddings ---
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
        body: JSON.stringify({ content: { parts: [{ text }] } })
      }
    );
    const data = await res.json();
    return data.embedding?.values || [];
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    return [];
  }
}

// --- Consulta Pinecone com filtro opcional ---
async function queryPinecone(hypothesis, topK = 20, patternCandidates = []) {
  const vector = await embedText(hypothesis);
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
async function classifyPattern(hypothesis, patternCandidates = []) {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: API_KEY,
    verbose: true
  });

  const relevantDocs = await queryPinecone(hypothesis, 20, patternCandidates);
  const context = relevantDocs.join("\n\n---\n\n");

  const idioma = franc(hypothesis);
  const idiomaTexto = idioma === 'por' ? 'português' : 'inglês';

  const prompt = `
You are an expert in software architecture.
Task:
Given the hypothesis and the document content below, select up to one ArchHypo pattern that best match the hypothesis.
Do NOT invent patterns.

If the selected pattern is "What You Need to Know", then substitute it with "Software Analytics" in the result.

Respond in **${idiomaTexto}** with valid JSON:
${parser.getFormatInstructions()}

Hypothesis:
"${hypothesis}"

Document content:
${context}
`;

  const response = await llm.invoke(prompt);
  const rawOutput = response.text || response.candidates?.[0]?.content || '';
  const cleaned = rawOutput.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

  return await parser.parse(cleaned);
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
    const { hypothesis, patternCandidates = [] } = JSON.parse(event.body);
    if (!hypothesis) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing hypothesis.' }) };
    }

    const result = await classifyPattern(hypothesis, patternCandidates);
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
