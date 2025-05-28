import pdf from 'pdf-parse/lib/pdf-parse';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
import crypto from 'crypto';
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

function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function extractTextFromPDFWithCache(filePath) {
  const cacheDir = path.join(__dirname, 'cache');
  await fs.ensureDir(cacheDir);

  const fileHash = getFileHash(filePath);
  const cacheFile = path.join(cacheDir, `${path.basename(filePath)}.json`);

  if (await fs.pathExists(cacheFile)) {
    const cached = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
    if (cached.hash === fileHash) {
      console.log(`✅ Cache hit for ${path.basename(filePath)}`);
      return cached.text;
    }
  }

  console.log(`⏳ Parsing ${path.basename(filePath)}...`);
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  const cleaned = cleanText(data.text);

  const cacheData = {
    hash: fileHash,
    text: cleaned,
  };

  await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
  console.log(`💾 Cached ${path.basename(filePath)}`);
  return cleaned;
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
    console.error('❌ Error parsing JSON:', cleaned);
    throw error;
  }
}

export async function handler(event) {
  const startTime = Date.now();

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Use POST.' }),
    };
  }

  try {
    const parseStart = Date.now();
    const { hypothesis } = JSON.parse(event.body);
    console.log(`Parse Event Body: ${(Date.now() - parseStart) / 1000}s`);

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

    const readStart = Date.now();
    const texts = await Promise.all(
      pdfFiles.map(async (file) => {
        return extractTextFromPDFWithCache(path.join(folderPath, file));
      })
    );
    console.log(`Read PDFs & Cache: ${(Date.now() - readStart) / 1000}s`);

    const combinedText = texts.join('\n\n---\n\n');
    console.log('Texts combined.');

    const classifyStart = Date.now();
    const result = await classifyPattern(hypothesis, combinedText);
    console.log(`Classify Pattern: ${(Date.now() - classifyStart) / 1000}s`);

    console.log(`Total Handler Time: ${(Date.now() - startTime) / 1000}s`);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
