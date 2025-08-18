// Igual ao de incerteza, só muda o prompt:
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
    `Dado o contexto: "{input}", classifique o impacto e explique o motivo utilizando o Impact Historical: 
    -------------------------------------------------------------
  Caso o Impact Historical não tenha informação, seguir a regra abaixo:  
  Very Low: Hardly affects the architecture.
  Low: Small impact, easy to fix.
  Medium: Affects some components or functionalities.
  High: Affects important parts of the architecture.
  Very High: Could completely compromise the system, jeopardize the project, or cause major losses.
Responda no formato JSON e **utilize o mesmo idioma do input**: 
{{"sugestao": Very Low|Low|Medium|High|Very High", "motivo": "explicação"}}.`
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
