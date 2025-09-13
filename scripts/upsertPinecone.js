import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Document } from 'langchain/document';
import { TokenTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

function hashId(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 16);
}

function generateSummary(text) {
  return text.split(/\s+/).slice(0, 30).join(" ") + "...";
}

function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

async function extractTextFromPDF(filePath) {
  console.log(`📄 Lendo PDF: ${filePath}`);
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  const fullText = data.text.replace(/\n(?=\w)/g, ' ').replace(/\n{2,}/g, '\n\n');

  // Corta tudo após a primeira ocorrência de "Therefore"
  const match = fullText.match(/^(.*?)(?=\bTherefore\b)/is);
  const filteredText = match ? match[1].trim() : fullText;

  console.log(`📄 Texto filtrado com ${filteredText.length} caracteres`);
  return filteredText;
}

async function embedText(text) {
  console.log(`🔗 Gerando embedding para texto com ${text.length} caracteres`);
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
  if (!data.embedding?.values) {
    console.error("❌ Falha ao gerar embedding:", data);
    throw new Error("Embedding inválido");
  }
  return data.embedding.values;
}

async function upsertWithMetadata(index, docs, baseMeta) {
  console.log(`📦 Upsert de ${docs.length} documentos para ${baseMeta.paperId}`);
  for (const d of docs) {
    const id = `${baseMeta.paperId}-${hashId(d.pageContent)}`;
    const vector = await embedText(d.pageContent);
    const payload = {
      id,
      values: vector,
      metadata: {
        ...baseMeta,
        section: d.metadata.section,
        summary: generateSummary(d.pageContent),
        keywords: extractKeywords(d.pageContent),
        text: d.pageContent
      }
    };
    await index.upsert([payload]);
    console.log(`✅ Documento inserido: ${id}`);
  }
}

async function prepareVectorDB() {
  const folderPath = path.resolve(process.cwd(), 'netlify/functions/docs');
  console.log(`📁 Verificando pasta: ${folderPath}`);
  if (!(await fs.pathExists(folderPath))) throw new Error("❌ Pasta 'docs' não encontrada.");

  const files = await fs.readdir(folderPath);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  console.log(`📄 PDFs encontrados: ${pdfFiles.length}`);
  if (pdfFiles.length === 0) throw new Error("❌ Nenhum arquivo PDF encontrado.");

  const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);
  console.log(`🔍 Conectado ao índice Pinecone: ${PINECONE_INDEX}`);

  for (const file of pdfFiles) {
    console.log(`📄 Processando arquivo: ${file}`);
    const filteredText = await extractTextFromPDF(path.join(folderPath, file));

    const splitter = new TokenTextSplitter({
      encodingName: "cl100k_base",
      chunkSize: 700,
      chunkOverlap: 80,
    });

    const parts = await splitter.splitText(filteredText);
    const docs = parts.map((part, i) => new Document({
      pageContent: part,
      metadata: { section: `Chunk ${i + 1}` }
    }));

    console.log(`📄 Chunks gerados: ${docs.length}`);
    await upsertWithMetadata(index, docs, { paperId: path.basename(file, '.pdf') });
  }

  console.log("🎉 Pinecone atualizado com sucesso!");
}

(async () => {
  try {
    await prepareVectorDB();
  } catch (err) {
    console.error("💥 Erro ao atualizar Pinecone:", err);
    process.exit(1);
  }
})();
