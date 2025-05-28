import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

import { StructuredOutputParser } from 'langchain/output_parsers';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "ArchHypo pattern name.",
  reason: "Reason for choosing this pattern.",
});

// Função para obter texto do cache
async function getCachedText() {
  const cachePath = path.join(process.cwd(), '.netlify', 'functions-serve', '.cache');
  const cacheFile = path.join(cachePath, 'cache.txt');
  const exists = await fs.pathExists(cacheFile);
  if (!exists) throw new Error('Cache file not found. Run buildCache endpoint first.');
  return fs.readFile(cacheFile, 'utf-8');
}

async function classifyPattern(hypothesis) {
  const combinedText = await getCachedText();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `
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

  return parser.parse(cleaned);
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
