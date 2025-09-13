import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Pinecone } from "@pinecone-database/pinecone";
import { franc } from 'franc';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "Nome do padrão mais apropriado",
  reason: "Justificativa da escolha"
});

async function getPineconeClient() {
  return new Pinecone({ apiKey: PINECONE_API_KEY });
}

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
  return data.embedding?.values || [];
}

async function queryPinecone(hypothesis, topK = 50) {
  const vector = await embedText(hypothesis);
  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  const queryResponse = await index.query({
    vector,
    topK,
    includeMetadata: true
  });

  return queryResponse.matches || [];
}

async function classifyPattern(hypothesis) {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: API_KEY,
    verbose: true
  });

  const topChunks = await queryPinecone(hypothesis, 50);
  const context = topChunks.map(c => `Chunk: ${c.metadata.section}\n${c.metadata.text}`).join("\n\n---\n\n");

  const idioma = franc(hypothesis) === 'por' ? 'português' : 'inglês';

  const prompt = `
Você é especialista em arquitetura de software.
Tarefa:
Dado o conteúdo abaixo e a hipótese, selecione o padrão ArchHypo mais apropriado.
Não invente padrões. Use apenas os existentes.

Responda em **${idioma}** com JSON válido:
${parser.getFormatInstructions()}

Hipótese:
"${hypothesis}"

Contexto:
${context}
`;

  const response = await llm.invoke(prompt);
  const rawOutput = response.text || response.candidates?.[0]?.content || '';
  const cleaned = rawOutput.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const parsed = await parser.parse(cleaned);

  return {
    pattern: parsed.pattern,
    reason: parsed.reason,
    retrievedDocs: topChunks.map(c => c.metadata.text)
  };
}

// --- Métricas ---
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
  if (!retrieved || retrieved.length === 0) return 0;

  const terms = hypothesis
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 3);

  if (terms.length === 0) return 0;

  const scores = retrieved.map(doc => {
    const docTerms = new Set(
      doc.toLowerCase().split(/\W+/).filter(t => t.length > 3)
    );
    const matchCount = terms.filter(term => docTerms.has(term)).length;
    return matchCount / terms.length;
  });

  return scores.reduce((sum, val) => sum + val, 0) / scores.length;
}

async function factualConsistencyScore(text, documents) {
  const textEmbedding = await embedText(text);
  const docEmbeddings = await Promise.all(documents.map(embedText));

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  };

  const scores = docEmbeddings.map(docEmb => cosineSimilarity(textEmbedding, docEmb));
  return scores.reduce((sum, val) => sum + val, 0) / scores.length;
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
    const retrievedDocs = result.retrievedDocs;

    const evaluation = {
      precisionAt5: precisionAtK(retrievedDocs, retrievedDocs, 5),
      hitRate: hitRate(retrievedDocs, retrievedDocs),
      mrr: meanReciprocalRank(retrievedDocs, retrievedDocs),
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