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
  pattern: "Name of the chosen ArchHypo pattern.",
  reason: "Reason for the choice.",
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
    model: "gemini-2.5-flash",  // Sem o 'models/' na frente
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
You are an expert in software architecture.

Task:
Given the hypothesis and the document content below, select up to three most appropriate ArchHypo patterns (separated by commas) that match the hypothesis.

Do NOT invent, assume, or suggest any pattern not present in the document content.

Respond ONLY with valid JSON using this format:
${parser.getFormatInstructions()}

Hypothesis:
"${hypothesis}"

Pattern clarification examples:
- "Tracer Bullets": when the hypothesis involves building a minimal, functional implementation to quickly test feasibility or integration in practice.

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
    console.error('❌ Parser JSON Error:', cleaned);
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
    console.time('🔍 Total Time');

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

    console.time('📄 Reading PDF files');
    const files = await fs.readdir(folderPath);
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));
    console.timeEnd('📄 Reading PDF files');

    if (pdfFiles.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No PDF files found.' }),
      };
    }

    console.time('📝 Extract PDFs info');
    const texts = await Promise.all(
      pdfFiles.map((file) => extractTextFromPDF(path.join(folderPath, file)))
    );
    console.timeEnd('📝 Extract PDFs info');

    const result = await classifyPattern(hypothesis, texts);

    console.timeEnd('🔍 Total Time');

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