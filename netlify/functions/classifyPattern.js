import pdf from 'pdf-parse/lib/pdf-parse'
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

import { StructuredOutputParser } from 'langchain/output_parsers';
import { HumanMessage } from '@langchain/core/messages';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "Nome do padrão ArchHypo escolhido.",
  reason: "Motivo da escolha.",
});

async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function classifyPattern(hypothesis, combinedText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
Com base na hipótese: "${hypothesis}" e considerando o texto dos documentos abaixo, escolha **apenas um** padrão ArchHypo que melhor se aplica e explique o motivo da escolha.

Responda no seguinte formato JSON:
${parser.getFormatInstructions()}

Documentos:
${combinedText}
`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await axios.post(url, body);
  const raw = response.data.candidates[0].content.parts[0].text.trim();

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return parser.parse(cleaned);
  } catch (error) {
    console.error('Erro ao fazer parse do JSON:', cleaned);
    throw error;
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Use POST.' }),
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

    const folderPath = path.join(__dirname, 'docs');

    if (!(await fs.pathExists(folderPath))) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Docs folder not found.' }),
      };
    }

    const files = await fs.readdir(folderPath);
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));

    if (pdfFiles.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'No PDF files found.' }),
      };
    }

    const texts = await Promise.all(
      pdfFiles.map((file) => extractTextFromPDF(path.join(folderPath, file)))
    );

    const combinedText = texts.join('\n\n---\n\n');
    const result = await classifyPattern(hypothesis, combinedText);

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
