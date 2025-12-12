import dotenv from 'dotenv';
import fetch from "node-fetch";
import { StructuredOutputParser } from 'langchain/output_parsers';
import { Pinecone } from "@pinecone-database/pinecone";
import { cleanAndParseJSON } from './utils/json-utils.js';

dotenv.config();

const API_KEY = process.env.GENAI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

// --- Parser JSON ---
const parser = StructuredOutputParser.fromNamesAndDescriptions({
  pattern: "Names of select the most appropriate ArchHypo pattern",
  reason: "Reason for the choice.",
});

// --- Inicializa Pinecone ---
async function getPineconeClient() {
  return new Pinecone({ apiKey: PINECONE_API_KEY });
}

async function embedText(text) {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": API_KEY
        },
        body: JSON.stringify({
          model: "gemini-embedding-001",
          content: {
            parts: [{ text }]
          }
        })
      }
    );

    if (!res.ok) {
      console.error(`❌ Erro na requisição: ${res.status} - ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    if (!data.embedding || !Array.isArray(data.embedding.values)) {
      console.error("❌ Embedding não retornado corretamente:", data);
      return null;
    }

    return data.embedding.values;
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    return null;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function embedTextWithRetry(text, retries = 3, delayMs = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const embedding = await embedText(text);
    if (embedding && Array.isArray(embedding) && embedding.length > 0) {
      return embedding;
    }
    console.warn(`Tentativa ${attempt + 1} falhou. Retentando em ${delayMs}ms...`);
    await delay(delayMs * Math.pow(2, attempt)); // backoff exponencial
  }
  console.error("❌ Todas as tentativas de embedding falharam.");
  return null;
}

async function queryPinecone(hypothesis, topK = 20, patternCandidates = []) {
  const vector = await embedTextWithRetry(hypothesis, 3, 1000);

  if (!vector || !Array.isArray(vector) || vector.length === 0) {
    console.warn("Embedding inválido ou vazio. Consulta ao Pinecone abortada.");
    return [];
  }

  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  const queryParams = {
    vector,
    topK,
    includeMetadata: true,
    includeValues: true // necessário para calcular factualConsistencyScore
  };

  if (patternCandidates.length > 0) {
    queryParams.filter = {
      patternName: { $in: patternCandidates }
    };
  }

  try {
    const queryResponse = await index.query(queryParams);
    const matches = queryResponse.matches || [];

    console.log(`🔍 ${matches.length} documentos recuperados do Pinecone.`);

    return {
      embedding: vector,
      matches
    };
  } catch (error) {
    console.error("❌ Erro ao consultar Pinecone:", error);
    return {
      embedding: vector,
      matches: []
    };
  }
}

// --- Classificação com LLM ---
async function classifyPattern(hypothesis, patternCandidates = [], language = 'pt') {
  const { matches } = await queryPinecone(hypothesis, 20, patternCandidates);

  const relevantDocs = matches
    .map(m => m.metadata?.text)
    .filter(text => typeof text === "string" && text.trim().length > 0);

  const context = relevantDocs.length > 0
    ? relevantDocs.join("\n\n---\n\n")
    : "Nenhum documento relevante encontrado.";

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = `You are a Senior Software Architect, specialized in methodologies for validating architectural hypotheses.

**Objective:**
Your task is to analyze the provided **Hypothesis** and **Document Content**. Based on this analysis, you must select the **single** "ArchHypo" pattern from the list below that best applies to validate, investigate, or resolve the hypothesis.

---

**Available "ArchHypo" Patterns and Their Definitions:**

1.**Architectural Spike:**
  - **Explanation:** Used when there is technical uncertainty about an architectural solution. It consists of developing a minimal, temporary implementation to explore the feasibility of a technology or approach.

2.**Architectural Trigger:**
  - **Explanation:** Identifies events or changes (e.g., requirements, scale, regulations) that require an architectural re-evaluation or decision.

3. **Bring the Specialist:**
  - **Explanation:** Recommends involving specialists when the team faces a complex architectural decision or one that is outside their expertise to ensure well-founded decisions.

4.**Continuous Inspection:**
  - **Explanation:** Promotes the continuous review of the architecture throughout the project's lifecycle to identify deviations, risks, and opportunities for improvement.

5.**Learning from Experiments:**
  - **Explanation:** Suggests that architectural decisions should be preceded by controlled experiments that generate real data and learning to reduce risks.

6.**Plan for Preparation:**
  - **Explanation:** Encourages preparing the architecture for future decisions by creating flexibility, modularity, and abstractions that allow for low-cost changes.

7.**Postpone Uncertain Decisions:**
  - **Explanation:** Recommends postponing a decision that involves many unknown variables or high risks until more information is available.

8.**Protective Guideline:**
  - **Explanation:** Establishes architectural guidelines that protect the project from inconsistent decisions, inadequate techniques, or violations of standards.

9.**Quality Checkpoint:**
  - **Explanation:** Creates specific moments in the development cycle to assess whether the architecture is meeting the defined quality attributes (e.g., performance, security).

10. **Software Analytics:**
  - **Explanation:** Focuses on identifying and filling knowledge gaps that impede architectural decisions, encouraging the active search for information through research or data analysis.

11.**Technical Debt Management:**
  - **Explanation:** Addresses the identification, prioritization, and mitigation of accumulated technical debt to avoid compromising the evolution of the architecture.

12.**Tracer Bullets:**
  - **Explanation:** Minimal implementations that cut through the system from end to end to quickly validate flows, integrations, and the overall architecture.

---

**Analysis Instructions:**
1.  Carefully read the **Hypothesis**. This is your main focus.
2.  Use the **Document Content** as supporting evidence to understand the hypothesis context.
3.  Select the **single pattern** that best represents the approach for the situation.
4.  **Do NOT invent patterns.**
5.  Justify your choice in 2 sentences, connecting the hypothesis with the definition of the chosen pattern.

Respond in **${idiomaTexto}** with valid JSON:
${parser.getFormatInstructions()}

Hypothesis:
"${hypothesis}"

Document content:
${context}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    }
  );
  const data = await response.json();
  console.log(data)
  const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  try {
    const parsed = cleanAndParseJSON(rawOutput);
    console.log("✅ JSON válido recebido do LLM:", parsed);
    return parsed;
  } catch (error) {
    console.error("❌ Erro ao parsear JSON:", rawOutput);
    throw error;
  }

}

// --- Métricas de avaliação ---
function precisionAtK(retrieved, relevant, k) {
  if (!Array.isArray(retrieved) || !Array.isArray(relevant) || k <= 0) return 0;
  const topK = retrieved.slice(0, k);
  const relevantSet = new Set(relevant);
  const hits = topK.filter(doc => relevantSet.has(doc));
  return hits.length / k;
}

function hitRate(retrieved, relevant) {
  if (!Array.isArray(retrieved) || !Array.isArray(relevant) || relevant.length === 0) return 0;
  const relevantSet = new Set(relevant);
  const hits = retrieved.filter(doc => relevantSet.has(doc));
  return hits.length / relevant.length;
}

function meanReciprocalRank(retrieved, relevant) {
  if (!Array.isArray(retrieved) || !Array.isArray(relevant)) return 0;
  const relevantSet = new Set(relevant);
  for (let i = 0; i < retrieved.length; i++) {
    if (relevantSet.has(retrieved[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

function relevanceScore(hypothesis, retrieved) {
  if (typeof hypothesis !== "string" || !Array.isArray(retrieved) || retrieved.length === 0) return 0;
  const terms = hypothesis.toLowerCase().split(/\W+/).filter(t => t.length > 3);
  if (terms.length === 0) return 0;

  const scores = retrieved.map(doc => {
    const docLower = doc.toLowerCase();
    const count = terms.filter(term => docLower.includes(term)).length;
    return count / terms.length;
  });

  const validScores = scores.filter(s => typeof s === "number" && isFinite(s));
  return validScores.length ? validScores.reduce((sum, val) => sum + val, 0) / validScores.length : 0;
}

async function factualConsistencyScoreFromPinecone(textEmbedding, pineconeMatches) {
  if (!Array.isArray(textEmbedding) || textEmbedding.length === 0) {
    console.warn("Embedding do texto está vazio ou inválido.");
    return null;
  }

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return normA && normB ? dot / (normA * normB) : 0;
  };

  const scores = pineconeMatches
    .filter(match => Array.isArray(match.values) && match.values.length === textEmbedding.length)
    .map(match => cosineSimilarity(textEmbedding, match.values));

  const validScores = scores.filter(s => typeof s === "number" && isFinite(s));
  const avgScore = validScores.length ? validScores.reduce((sum, val) => sum + val, 0) / validScores.length : 0;

  return avgScore;
}
// --- Netlify Function handler ---
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Use POST.' }) };
  }

  try {
    const { hypothesis, patternCandidates = [], language = 'pt' } = JSON.parse(event.body);
    if (!hypothesis) return { statusCode: 400, body: JSON.stringify({ error: 'Missing hypothesis.' }) };

    const result = await classifyPattern(hypothesis, patternCandidates, language);

    // Consulta ao Pinecone com embedding e matches
    const { embedding, matches } = await queryPinecone(hypothesis, 20, patternCandidates);

    // Cálculo da métrica factual
    const score = await factualConsistencyScoreFromPinecone(embedding, matches);

    // Extrai os textos dos documentos relevantes
    const relevantDocs = matches
      .map(m => m.metadata?.text)
      .filter(text => typeof text === "string" && text.trim().length > 0);

    // Avaliação das métricas
    const evaluation = {
      precisionAt5: precisionAtK(relevantDocs, relevantDocs, 5),
      hitRate: hitRate(relevantDocs, relevantDocs),
      mrr: meanReciprocalRank(relevantDocs, relevantDocs),
      factualConsistencyScore: score,
      relevanceScore: relevanceScore(hypothesis, relevantDocs)
    };


    return {
      statusCode: 200,
      body: JSON.stringify({
        pattern: result.pattern,
        reason: result.reason,
        evaluation
      })
    };

  } catch (error) {
    console.error("Erro na função handler:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
