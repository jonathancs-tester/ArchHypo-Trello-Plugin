import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Pinecone } from "@pinecone-database/pinecone";
import { franc } from 'franc';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

// Parser JSON
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "Names of select the most appropriate ArchHypo pattern",
  reason: "Reason for the choice.",
});

// --- Inicializa Pinecone ---
async function getPineconeClient() {
  const client = new Pinecone({ apiKey: PINECONE_API_KEY });
  return client;
}

// --- Gera embeddings ---
async function embedText(text) {
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
  return data.embedding.values;
}

// --- Consulta Pinecone ---
async function queryPinecone(hypothesis, topK = 20) {
  const vector = await embedText(hypothesis);
  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  const queryResponse = await index.query({ vector, topK, includeMetadata: true });
  const matches = queryResponse.matches || [];
  return matches.map(m => m.metadata.text);
}

// --- Classificação com LLM ---
async function classifyPattern(hypothesis) {
  const llm = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", apiKey: API_KEY, verbose: true });
  const relevantDocs = await queryPinecone(hypothesis, 20);
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

  const parsed = await parser.parse(cleaned);
  return parsed;
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

async function calcularSimilaridadeSemantica(texto, documentos) {
  const textoEmbedding = await embedText(texto);
  const docsEmbeddings = await Promise.all(documentos.map(embedText));

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  };

  const scores = docsEmbeddings.map(docEmb => cosineSimilarity(textoEmbedding, docEmb));
  const avgScore = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  return avgScore;
}

// --- Netlify Function handler ---
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Use POST.' }) };
  }

  try {
    const { hypothesis } = JSON.parse(event.body);
    if (!hypothesis) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing hypothesis.' }) };
    }

    const result = await classifyPattern(hypothesis);
    const retrievedDocs = await queryPinecone(hypothesis, 20);
    const relevantDocs = retrievedDocs; // ajuste se tiver um conjunto específico

    const evaluation = {
      precisionAt5: precisionAtK(retrievedDocs, relevantDocs, 5),
      hitRate: hitRate(retrievedDocs, relevantDocs),
      factualConsistencyScore: await calcularSimilaridadeSemantica(result.pattern, retrievedDocs)
    };

    const response = {
      pattern: result.pattern,
      reason: result.reason,
      evaluation
    };

    return { statusCode: 200, body: JSON.stringify(response) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}