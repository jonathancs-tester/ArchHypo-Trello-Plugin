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
      Very Low: Almost certain, well known.
      Low: Little doubt, well understood.
      Medium: Some doubt exists, but some data helps.
      High: Considerable uncertainty, no solid data.
      Very High: It's practically a guess, no data, a complete unknown.
Responda no formato JSON e ONLY in English: 
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
