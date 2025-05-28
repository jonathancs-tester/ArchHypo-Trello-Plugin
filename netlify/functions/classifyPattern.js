import pdf from 'pdf-parse/lib/pdf-parse';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

import { StructuredOutputParser } from 'langchain/output_parsers';

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
  console.time('⏱️ Montagem do prompt + Chamada da API');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const prompt = `
Hypothesis: "${hypothesis}"
From the documents below, select **one** ArchHypo pattern that best matches.
Respond in JSON:
${parser.getFormatInstructions()}
Documents:
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

  console.timeEnd('⏱️ Montagem do prompt + Chamada da API');

  console.time('⏱️ Parse da resposta');
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const parsed = parser.parse(cleaned);
    console.timeEnd('⏱️ Parse da resposta');
    return parsed;
  } catch (error) {
    console.timeEnd('⏱️ Parse da resposta');
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

    const combinedText = texts.join('\n\n---\n\n');

    const result = await classifyPattern(hypothesis, combinedText);

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
