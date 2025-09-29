import dotenv from 'dotenv';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
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

// --- Gera embeddings ---
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
        body: JSON.stringify({ content: { parts: [{ text }] } })
      }
    );
    const data = await res.json();
    return data.embedding?.values || [];
  } catch (error) {
    console.error("Erro ao gerar embedding:", error);
    return [];
  }
}

// --- Consulta Pinecone com filtro opcional ---
async function queryPinecone(hypothesis, topK = 20, patternCandidates = []) {
  const vector = await embedText(hypothesis);
  const pinecone = await getPineconeClient();
  const index = pinecone.index(PINECONE_INDEX);

  const queryParams = {
    vector,
    topK,
    includeMetadata: true
  };

  if (patternCandidates.length > 0) {
    queryParams.filter = {
      patternName: { $in: patternCandidates }
    };
  }

  const queryResponse = await index.query(queryParams);
  const matches = queryResponse.matches || [];
  return matches.map(m => m.metadata.text);
}

// --- Classificação com LLM ---
async function classifyPattern(hypothesis, patternCandidates = [], language = 'pt') {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: API_KEY,
    verbose: true
  });

  const relevantDocs = await queryPinecone(hypothesis, 20, patternCandidates);
  const context = relevantDocs.join("\n\n---\n\n");

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = `Você é um Arquiteto de Software sênior, especialista em metodologias de validação de hipóteses arquiteturais.

**Objetivo:**
Sua tarefa é analisar a **Hipótese** e o **Conteúdo do Documento** fornecidos. Com base nessa análise, você deve selecionar o **único** padrão "ArchHypo" da lista abaixo que melhor se aplica para validar, investigar ou resolver a hipótese.

---

**Padrões "ArchHypo" Disponíveis e Suas Definições:**

1.  **Architectural Spike:**
    - **Explicação:** Utilizado quando há incerteza técnica sobre uma solução arquitetural. Consiste em desenvolver uma implementação mínima e temporária para explorar a viabilidade de uma tecnologia ou abordagem.

2.  **Architectural Trigger:**
    - **Explicação:** Identifica eventos ou mudanças (requisitos, escala, regulamentação) que exigem uma reavaliação ou tomada de decisão arquitetural.

3.  **Bring the Specialist:**
    - **Explicação:** Recomenda envolver especialistas quando a equipe enfrenta uma decisão arquitetural complexa ou fora de sua expertise para garantir decisões bem fundamentadas.

4.  **Continuous Inspection:**
    - **Explicação:** Promove a revisão contínua da arquitetura ao longo do ciclo de vida do projeto para identificar desvios, riscos e oportunidades de melhoria.

5.  **Learning from Experiments:**
    - **Explicação:** Sugere que decisões arquiteturais sejam precedidas por experimentos controlados que gerem dados e aprendizados reais para reduzir riscos.

6.  **Plan for Preparation:**
    - **Explicação:** Incentiva preparar a arquitetura para decisões futuras, criando flexibilidade, modularidade e abstrações que permitam mudanças com baixo custo.

7.  **Postpone Uncertain Decisions:**
    - **Explicação:** Recomenda adiar uma decisão que envolve muitas variáveis desconhecidas ou riscos altos até que mais informações estejam disponíveis.

8.  **Protective Guideline:**
    - **Explicação:** Estabelece diretrizes arquiteturais que protegem o projeto contra decisões inconsistentes, técnicas inadequadas ou violações de padrões.

9.  **Quality Checkpoint:**
    - **Explicação:** Cria momentos específicos no ciclo de desenvolvimento para avaliar se a arquitetura está atendendo aos atributos de qualidade definidos (desempenho, segurança, etc.).

10. **Software Analytics (What You Need to Know):**
    - **Explicação:** Foca em identificar e preencher lacunas de conhecimento que impedem decisões arquiteturais, incentivando a busca ativa por informações através de pesquisa ou análise de dados.

11. **Technical Debt Management:**
    - **Explicação:** Trata da identificação, priorização e mitigação da dívida técnica acumulada para não comprometer a evolução da arquitetura.

12. **Tracer Bullets:**
    - **Explicação:** Implementações mínimas que percorrem o sistema de ponta a ponta para validar fluxos, integrações e a arquitetura geral rapidamente.

---

**Instruções de Análise:**
1.  Leia atentamente a **Hipótese**. Este é o seu foco principal.
2.  Use o **Conteúdo do Documento** como evidência de suporte para entender o contexto da hipótese.
3.  Compare a intenção da hipótese com as definições dos 12 padrões "ArchHypo" listados acima.
4.  Selecione o **único padrão** que representa a melhor abordagem para a situação.
5.  Se **nenhum** padrão se aplicar de forma clara, o valor da chave "pattern" deve ser "N/A".
6.  Justifique sua escolha em 1-2 frases, conectando a hipótese com a definição do padrão escolhido.

**Formato da Resposta:**
Responda em **${idiomaTexto}** com um objeto JSON válido, seguindo estritamente este formato:
${parser.getFormatInstructions()}
---

**Dados para Análise:**

**Hipótese:**
"${hypothesis}"

**Conteúdo do Documento:**
${context}
`;

  const response = await llm.invoke(prompt);
  const rawOutput = response.text || response.candidates?.[0]?.content || '';

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
  const topK = retrieved.slice(0, k);
  const relevantSet = new Set(relevant);
  const hits = topK.filter(doc => relevantSet.has(doc));
  return hits.length / k;
}

function hitRate(retrieved, relevant) {
  const relevantSet = new Set(relevant);
  const hits = retrieved.filter(doc => relevantSet.has(doc));
  return hits.length / relevant.length;
}

function meanReciprocalRank(retrieved, relevant) {
  const relevantSet = new Set(relevant);
  for (let i = 0; i < retrieved.length; i++) {
    if (relevantSet.has(retrieved[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

function relevanceScore(hypothesis, retrieved) {
  const terms = hypothesis.toLowerCase().split(/\W+/).filter(t => t.length > 3);
  const scores = retrieved.map(doc => {
    const docLower = doc.toLowerCase();
    const count = terms.filter(term => docLower.includes(term)).length;
    return count / terms.length;
  });
  return scores.reduce((sum, val) => sum + val, 0) / scores.length;
}

async function factualConsistencyScore(text, documents) {
  const textEmbedding = await embedText(text);

  if (!Array.isArray(textEmbedding) || textEmbedding.length === 0) {
    console.warn("Embedding do texto está vazio ou inválido.");
    return null;
  }

  const docEmbeddings = await Promise.all(documents.map(async (doc, i) => {
    const emb = await embedText(doc);
    if (!Array.isArray(emb) || emb.length === 0) {
      console.warn(`Embedding do documento ${i} está vazio ou inválido.`);
    }
    return emb;
  }));

  const validEmbeddings = docEmbeddings.filter(e => Array.isArray(e) && e.length > 0);

  if (validEmbeddings.length === 0) {
    console.warn("Nenhum embedding válido nos documentos.");
    return null;
  }

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return normA && normB ? dot / (normA * normB) : 0;
  };

  const scores = validEmbeddings.map(docEmb => cosineSimilarity(textEmbedding, docEmb));
  const avgScore = scores.reduce((sum, val) => sum + val, 0) / scores.length;

  return isFinite(avgScore) ? avgScore : null;
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
    const retrievedDocs = await queryPinecone(hypothesis, 20, patternCandidates);
    const relevantDocs = retrievedDocs;

    const evaluation = {
      precisionAt5: precisionAtK(retrievedDocs, relevantDocs, 5),
      hitRate: hitRate(retrievedDocs, relevantDocs),
      mrr: meanReciprocalRank(retrievedDocs, relevantDocs),
      factualConsistencyScore: await factualConsistencyScore(result.pattern, retrievedDocs),
      relevanceScore: relevanceScore(hypothesis, retrievedDocs)
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
