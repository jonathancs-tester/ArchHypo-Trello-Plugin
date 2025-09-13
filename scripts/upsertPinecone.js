import pdf from 'pdf-parse/lib/pdf-parse.js';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Document } from 'langchain/document';
import { TokenTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

const headings = [
  "Abstract","Summary","Intent","Problem","Context","Forces","Solution",
  "Structure","Participants","Implementation","Applicability","Consequences",
  "Trade-offs","Known Uses","Examples","References","Discussion","Motivation","Resulting Context","Therefore"
];
const headingRegex = new RegExp(`\\n\\s*(?:${headings.join("|")})\\s*:?\\s*\\n`, "gi");

function splitBySections(raw) {
  const sections = [];
  const indices = [];
  let match;
  while ((match = headingRegex.exec(raw))) {
    indices.push({ idx: match.index, title: match[0].trim() });
  }
  indices.push({ idx: raw.length, title: "END" });

  for (let i = 0; i < indices.length - 1; i++) {
    const start = indices[i].idx;
    const end = indices[i + 1].idx;
    const title = indices[i].title.replace(/\n|:/g, "").trim();
    const text = raw.slice(i === 0 ? 0 : start, end).trim();
    if (text) sections.push({ title: title || "Body", text });
  }
  return sections;
}

function hashId(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 16);
}

function generateSummary(text) {
  return text.split(/\s+/).slice(0, 30).join(" ") + "...";
}

function extractKeywords(text) {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text.replace(/\n(?=\w)/g, ' ').replace(/\n{2,}/g, '\n\n');
}

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

async function upsertWithMetadata(index, docs, baseMeta) {
  for (const d of docs) {
    const id = `${baseMeta.paperId}-${hashId(d.pageContent)}`;
    const vector = await embedText(d.pageContent);
    await index.upsert([{
      id,
      values: vector,
      metadata: {
        ...baseMeta,
        section: d.metadata.section,
        summary: generateSummary(d.pageContent),
        keywords: extractKeywords(d.pageContent),
        text: d.pageContent
      }
    }]);
  }
}

async function prepareVectorDB() {
  const folderPath = path.resolve(process.cwd(), 'netlify/functions/docs');
  if (!(await fs.pathExists(folderPath))) throw new Error("Docs folder not found.");

  const files = await fs.readdir(folderPath);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  if (pdfFiles.length === 0) throw new Error("No PDF files found.");

  const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);

  for (const file of pdfFiles) {
    const rawText = await extractTextFromPDF(path.join(folderPath, file));
    const sections = splitBySections(rawText);

    const splitter = new TokenTextSplitter({
      encodingName: "cl100k_base",
      chunkSize: 700,
      chunkOverlap: 80,
    });

    const docs = [];
    for (const s of sections) {
      const parts = await splitter.splitText(s.text);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1 && part.split(/\s+/).length < 220 && docs.length) {
          docs[docs.length - 1].pageContent += "\n\n" + part;
        } else {
          docs.push(new Document({ pageContent: part, metadata: { section: s.title } }));
        }
      }
    }

    await upsertWithMetadata(index, docs, { paperId: path.basename(file, '.pdf') });
  }

  console.log("🎉 Pinecone atualizado com sucesso!");
}

(async () => {
  try {
    await prepareVectorDB();
  } catch (err) {
    console.error("💥 Erro ao atualizar Pinecone:", err);
    process.exit(1);
  }
})();
