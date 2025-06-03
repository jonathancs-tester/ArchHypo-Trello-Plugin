import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;

// 🔧 Parser do JSON
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "Nome do padrão ArchHypo escolhido.",
  reason: "Motivo da escolha.",
});

// 🔍 Função para extrair texto dos PDFs
async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

// 🔧 Função que monta o RAG
async function classifyPattern(hypothesis, combinedDocs) {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash-002",  // Sem o 'models/' na frente
    apiKey: API_KEY,
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200,
  });

  const docs = combinedDocs.map(
    (text) => new Document({ pageContent: text })
  );

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: API_KEY,
    model: "models/embedding-001",
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs,
    embeddings
  );

  const relevantDocs = await vectorStore.similaritySearch(hypothesis, 20);

  const context = relevantDocs.map((doc) => doc.pageContent).join("\n\n---\n\n");

  const prompt = `
You are an expert in software architecture and must respond ONLY in English.

Task:
Given the hypothesis below and the document content, select the **single most appropriate ArchHypo pattern** that matches the hypothesis.

Respond **ONLY** in valid JSON with this format:
${parser.getFormatInstructions()}

Do not add explanations, comments, or any extra text. Only the JSON.

Hypothesis:
"${hypothesis}"

Document content:
${context}
`;

  const response = await llm.invoke(prompt);

  const rawOutput = response.text || response.candidates?.[0]?.content || '';

  const cleaned = rawOutput
    .replace(/```(?:json)?\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    const parsed = await parser.parse(cleaned);
    return parsed;
  } catch (error) {
    console.error('❌ Erro ao fazer parse do JSON:', cleaned);
    throw error;
  }
}

// 🚀 Função Serverless Netlify
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Use POST.' }),
    };
  }

  try {
    console.time('🔍 Tempo total');

    const { hypothesis } = JSON.parse(event.body);

    if (!hypothesis) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing hypothesis.' }),
      };
    }

    const folderPath = path.join(__dirname, 'docs');

    if (!(await fs.pathExists(folderPath))) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Docs folder not found.' }),
      };
    }

    console.time('📄 Leitura dos arquivos PDF');
    const files = await fs.readdir(folderPath);
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));
    console.timeEnd('📄 Leitura dos arquivos PDF');

    if (pdfFiles.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No PDF files found.' }),
      };
    }

    console.time('📝 Extração de texto dos PDFs');
    const texts = await Promise.all(
      pdfFiles.map((file) => extractTextFromPDF(path.join(folderPath, file)))
    );
    console.timeEnd('📝 Extração de texto dos PDFs');

    const result = await classifyPattern(hypothesis, texts);

    console.timeEnd('🔍 Tempo total');

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}