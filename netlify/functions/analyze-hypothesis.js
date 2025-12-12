import { handleCors, corsHeaders } from './utils/cors.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanAndParseJSON } from './utils/json-utils.js';

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const { input, language = "pt" } = JSON.parse(event.body);

    const idiomaTexto = language === "pt" ? "português" : "inglês";

    // Inicializa o SDK oficial (v1)
    const genAI = new GoogleGenerativeAI(process.env.GENAI_API_KEY);

    // Escolha o melhor modelo Gemma 3 (pode trocar por 4b, 12b, 27b... tudo via v1)
    const model = genAI.getGenerativeModel({
      model: "gemma-3-4b",
    });

    // Prompt igual ao que você usa no LangChain
    const prompt = `
Você é um Agile Coach experiente, especialista em transformar incertezas de produto e engenharia em hipóteses claras e acionáveis. Sua tarefa é analisar o contexto de uma incerteza fornecida em "${input}" e gerar uma hipótese para validá-la, junto com o motivo pelo qual essa validação é importante.

**Definição dos Conceitos:**
- **Incerteza (Input):** Uma situação, problema ou ideia cujo impacto ou resultado é desconhecido.
- **Hipótese (sugestao):** Uma declaração clara e testável que propõe uma ação ou investigação para reduzir a incerteza. Geralmente segue o formato: "Acreditamos que [fazer uma ação] irá resultar em [um resultado esperado]".
- **Motivo (motivo):** A justificativa estratégica ou técnica. Explica por que é crucial testar a hipótese, destacando o risco a ser mitigado ou o valor a ser capturado.

**Instruções de Raciocínio:**
1. Leia a incerteza em "${input}".
2. Identifique o principal risco ou a questão a ser respondida.
3. Formule uma hipótese clara e acionável para testar essa questão.
4. Defina o motivo principal pelo qual testar essa hipótese agrega valor.
5. Estruture a resposta final em JSON.

**Regras de Saída:**
- A resposta deve ser um objeto JSON válido.
- O idioma deve ser exclusivamente ${idiomaTexto}.
- O JSON deve conter apenas as chaves "sugestao" e "motivo".

---
Incerteza Fornecida: "${input}"
`;

    // Chamada usando a API oficial v1
    const result = await model.generateContent(prompt);

    const rawText = result.response.text();

    // Faz o parse seguro (já que às vezes o modelo coloca código, markdown etc)
    const parsed = cleanAndParseJSON(rawText);

    const { sugestao, motivo } = parsed;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sugestao, motivo }),
    };

  } catch (error) {
    console.error("Gemma error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
