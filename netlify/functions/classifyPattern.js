import pdf from 'pdf-parse/lib/pdf-parse';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

import { StructuredOutputParser } from 'langchain/output_parsers';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "ArchHypo pattern name.",
  reason: "Reason for choosing this pattern.",
});

// Cache dos textos dos PDFs
let cachedText = null;

// Função para extrair texto de um PDF
async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

// Função para obter texto combinado (com cache)
async function getCombinedText() {
  if (cachedText) return cachedText;

  const folderPath = path.join(__dirname, 'docs');

  const exists = await fs.pathExists(folderPath);
  if (!exists) {
    throw new Error('Docs folder not found.');
  }

  const files = await fs.readdir(folderPath);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    throw new Error('No PDF files found in docs folder.');
  }

  const texts = await Promise.all(
    pdfFiles.map(file => extractTextFromPDF(path.join(folderPath, file)))
  );

  cachedText = texts.join('\n\n---\n\n');
  return cachedText;
}

// Função principal que envia o prompt para o Gemini
async function classifyPattern(hypothesis) {
  const combinedText = await getCombinedText();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
You are an assistant that must respond exclusively in English.

Based on the hypothesis: "${hypothesis}" and considering the text from the documents below, choose **only one** ArchHypo pattern that best applies.

The response must be **100% in English**, in the following JSON format:
${parser.getFormatInstructions()}

Documents:
${combinedText}
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const response = await axios.post(url, body, { timeout: 15000 });

  const raw = response.data.candidates[0].content.parts[0].text.trim();

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return parser.parse(cleaned);
  } catch (error) {
    console.error('Error parsing JSON:', cleaned);
    throw error;
  }
}

// Handler Netlify Function
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
    };
  }

  try {
    const { hypothesis } = JSON.parse(event.body);

    if (!hypothesis) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing hypothesis.' }),
      };
    }

    const result = await classifyPattern(hypothesis);

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
