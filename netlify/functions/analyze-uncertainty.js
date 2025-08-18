import { handleCors, corsHeaders } from './cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input } = JSON.parse(event.body);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: process.env.GENAI_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromTemplate(
    `Dada a seguinte descrição: "{input}", classifique o nível de incerteza e explique o motivo utilizando o Uncertainty Historical
    -------------------------------------------------------------
    Caso o Uncertainty Historical não tem informação, seguir a regra abaixo: 
      {
  "Very Low": {
    "nivel": "Very Low",
    "certeza": "Almost certain",
    "conhecimento": "Well known",
    "descricao": "A hipótese é baseada em informações sólidas e bem compreendidas. Há alta confiança na análise e pouca margem para erro."
  },
  "Low": {
    "nivel": "Low",
    "certeza": "Little doubt",
    "conhecimento": "Well understood",
    "descricao": "A hipótese tem boa base de conhecimento e poucas dúvidas. A situação é conhecida e há evidências que sustentam a análise."
  },
  "Medium": {
    "nivel": "Medium",
    "certeza": "Some doubt exists",
    "conhecimento": "Some data helps",
    "descricao": "A hipótese envolve certo grau de incerteza. Existem dados que ajudam, mas ainda há pontos que precisam de validação ou investigação."
  },
  "High": {
    "nivel": "High",
    "certeza": "Considerable uncertainty",
    "conhecimento": "No solid data",
    "descricao": "A hipótese é construída com base em suposições e pouca evidência concreta. A análise exige cautela e pode envolver riscos."
  },
  "Very High": {
    "nivel": "Very High",
    "certeza": "Practically a guess",
    "conhecimento": "No data, complete unknown",
    "descricao": "A hipótese é altamente especulativa. Não há dados disponíveis e o cenário é desconhecido, exigindo investigação profunda."
  }
}
Responda no formato JSON e **utilize o mesmo idioma do input** (por exemplo, se o input estiver em inglês, responda em inglês; se estiver em português, responda em português; se estiver em espanhol, responda em espanhol):
{{"sugestao": "Very Low|Low|Medium|High|Very High", "motivo": "explicação"}}.`
  );

  const chain = prompt.pipe(model);
  const result = await chain.invoke({ input });

  let cleaned = result.content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json|```/gi, "").trim();
  }

  const { sugestao, motivo } = JSON.parse(cleaned);

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ sugestao, motivo }),
  };
}
