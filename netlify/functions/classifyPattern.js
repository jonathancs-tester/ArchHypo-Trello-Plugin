import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Pinecone } from "@pinecone-database/pinecone";
import { cleanAndParseJSON } from './json-utils.js';

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
  console.log("🔌 Conectando ao Pinecone...");
  const client = new Pinecone({ apiKey: PINECONE_API_KEY });
  console.log("✅ Conectado ao Pinecone!");
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
  console.log(`🔎 Fazendo query no Pinecone com hipótese: "${hypothesis}"`);
  const vector = await embedText(hypothesis);
  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  const queryResponse = await index.query({ vector, topK, includeMetadata: true });
  const matches = queryResponse.matches || [];
  console.log(`📊 Query retornou ${matches.length} resultados do Pinecone`);

  matches.slice(0, 3).forEach((m, idx) => {
    console.log(`   ▶️ Match ${idx + 1}: (score=${m.score?.toFixed(3)}) "${m.metadata?.text?.slice(0, 80)}..."`);
  });

  return matches.map(m => m.metadata.text);
}

// --- Classificação com LLM ---
async function classifyPattern(hypothesis, language = 'pt') {
  const llm = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", apiKey: API_KEY, verbose: true });
  const relevantDocs = await queryPinecone(hypothesis, 20);
  const context = relevantDocs.join("\n\n---\n\n");

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  console.log(`🧠 Classificando hipótese (${idiomaTexto})...`);

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

  console.log("📝 Resposta LLM bruta:", rawOutput);

  try {
    // Usar a função de parse robusto
    const parsed = cleanAndParseJSON(rawOutput);
    console.log("✅ JSON válido recebido do LLM:", parsed);
    return parsed;
  } catch (error) {
    console.error("❌ Erro ao parsear JSON:", rawOutput);
    throw error;
  }
}

// --- Netlify Function handler ---
export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Use POST.' }) };

  try {
    const { hypothesis, language = 'pt' } = JSON.parse(event.body);
    if (!hypothesis) return { statusCode: 400, body: JSON.stringify({ error: 'Missing hypothesis.' }) };

    console.log("🚀 Iniciando processamento de hipótese...");

    const result = await classifyPattern(hypothesis, language);
    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error("💥 Erro geral:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
