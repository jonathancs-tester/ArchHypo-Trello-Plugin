import extract from 'pdf-text-extract';
import path from 'path';
import axios from 'axios';
import fs from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;

function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    extract(filePath, { splitPages: false }, (err, text) => {
      if (err) {
        reject(err);
      } else {
        resolve(text.join(' '));
      }
    });
  });
}

async function classifyPattern(hypothesis, combinedText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `Com base na hipótese: "${hypothesis}", e considerando o texto completo dos documentos abaixo, escolha **apenas um** padrão ArchHypo que melhor se aplica e explique o motivo da escolha:\n\n${combinedText}\n\nResponda somente no formato JSON assim:\n{\n  "pattern": "nome do padrão",\n  "reason": "motivo da escolha"\n}\n`,
          },
        ],
      },
    ],
  };

  const response = await axios.post(url, body);
  let rawText = response.data.candidates[0].content.parts[0].text.trim();

  // Remove blocos de código markdown ```json e ```
  rawText = rawText.replace(/^```json\s*/, '').replace(/```$/, '').trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error('Erro ao fazer parse do JSON retornado pelo Gemini:', rawText);
    throw err;
  }
}

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
        body: JSON.stringify({ error: 'Missing hypothesis in request body.' }),
      };
    }

    // Use __dirname direto (CommonJS)
   const folderPath = path.resolve(process.cwd(), 'docs');
   console.log(folderPath)

    if (!(await fs.pathExists(folderPath))) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Pasta de documentos não encontrada no servidor.' }),
      };
    }

    const files = await fs.readdir(folderPath);
    const pdfFiles = files.filter((file) => file.endsWith('.pdf'));

    const texts = await Promise.all(
      pdfFiles.map((file) => extractTextFromPDF(path.join(folderPath, file)))
    );

    const combinedText = texts.join('\n\n---\n\n');

    const bestPattern = await classifyPattern(hypothesis, combinedText);

    return {
      statusCode: 200,
      body: JSON.stringify(bestPattern),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
