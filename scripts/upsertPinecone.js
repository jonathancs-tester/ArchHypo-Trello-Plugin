// scripts/updateVectorDB.js
import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

// Inicializa Pinecone
async function getPineconeClient() {
  console.log("🔌 Conectando ao Pinecone...");
  const client = new Pinecone({ apiKey: PINECONE_API_KEY });
  console.log("✅ Conectado ao Pinecone!");
  return client;
}

// Função para extrair texto dos PDFs
async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  
  let text = data.text;
  const cutoffIndex = text.indexOf("Therefore:");
  if (cutoffIndex !== -1) {
    text = text.substring(0, cutoffIndex);
  }

  console.log(`📄 Extraído texto de: ${path.basename(filePath)} (${text.length} chars antes de 'Therefore:')`);
  return text;
  // console.log(`📄 Extraído texto de: ${path.basename(filePath)} (${data.text.length} chars)`);
  // return data.text;
}

// Função para gerar embeddings
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

// Função de upsert no Pinecone
async function upsertDocumentsToPinecone(docs) {
  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  console.log(`📥 Iniciando upsert de ${docs.length} chunks no Pinecone...`);

  for (let i = 0; i < docs.length; i++) {
    const chunk = docs[i].pageContent;
    const vector = await embedText(chunk);

    await index.upsert([
      { id: `doc-${i}`, values: vector, metadata: { text: chunk } }
    ]);

    if (i % 5 === 0) console.log(`⚡ Chunk ${i + 1}/${docs.length} upsertado (dim=${vector.length})`);
  }

  console.log(`✅ Finalizado: ${docs.length} chunks foram upsertados no Pinecone`);
}

// Prepara base Pinecone a partir dos PDFs
async function prepareVectorDB() {
  const folderPath = path.resolve(process.cwd(), 'netlify/functions/docs');
  if (!(await fs.pathExists(folderPath))) throw new Error("Docs folder not found.");

  const files = await fs.readdir(folderPath);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  if (pdfFiles.length === 0) throw new Error("No PDF files found.");

  console.log(`📂 Encontrados ${pdfFiles.length} arquivos PDF`);

  const texts = await Promise.all(pdfFiles.map(file => extractTextFromPDF(path.join(folderPath, file))));
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 200 });
  const docs = texts.map(t => new Document({ pageContent: t }));
  const splitDocs = await splitter.splitDocuments(docs);

  console.log(`✂️ Divididos em ${splitDocs.length} chunks`);

  await upsertDocumentsToPinecone(splitDocs);
}

// Função main
(async () => {
  try {
    await prepareVectorDB();
    console.log("🎉 Pinecone atualizado com sucesso!");
  } catch (err) {
    console.error("💥 Erro ao atualizar Pinecone:", err);
    process.exit(1);
  }
})();
