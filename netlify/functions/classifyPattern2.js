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

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/-{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/Page\s\d+/gi, '')
    .trim();
}

async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return cleanText(data.text);
}

async function summarizeText(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
Summarize the following document by identifying relevant information about each ArchHypo pattern listed below:

- Climbing on the Shoulders of Giants
- Find Where it Hurts
- Plan for Responsible Moments
- Tracer Bullets
- Test Architecture

Provide a brief, clear summary for each pattern based solely on the document content.

Document:
${text}
`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const response = await axios.post(url, body);
  return response.data.candidates[0].content.parts[0].text.trim();
}

async function classifyPattern(hypothesis, combinedText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
Based on the hypothesis: "${hypothesis}" and considering the text from the documents below, choose **only one** ArchHypo pattern that best applies.
The response must be **100% in English**, in the following JSON format:
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

// CACHE EM MEMÓRIA — variável global no módulo
const cachedSummaries = {};

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

    // Usa cache em memória
    const summaries = await Promise.all(
      pdfFiles.map(async (file) => {
        if (cachedSummaries[file]) {
          return cachedSummaries[file];
        }
        const text = await extractTextFromPDF(path.join(folderPath, file));
        const summary = await summarizeText(text);
        cachedSummaries[file] = summary;
        return summary;
      })
    );

    const combinedText = summaries.join('\n\n---\n\n');
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
