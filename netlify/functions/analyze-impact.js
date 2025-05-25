// Igual ao de incerteza, só muda o prompt:
import { handleCors, corsHeaders } from './cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input } = JSON.parse(event.body);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GENAI_API_KEY,
  });

  const prompt = ChatPromptTemplate.fromTemplate(
    `Dado o contexto: "{input}", classifique o impacto e explique o motivo, seguindo a regra abaixo: 
    Muito Baixo: Quase não afeta a arquitetura.
    Baixo: Pequeno impacto, fácil de corrigir.
    Médio:Afeta alguns componentes ou funcionalidades.
    Alto: Afeta partes importantes da arquitetura.
    Muito Alto: Pode comprometer completamente o sistema, inviabilizar o projeto ou gerar grandes perdas.
Responda no formato JSON: 
{{"sugestao": "Muito Baixo|Baixo|Médio|Alto|Muito Alto", "motivo": "explicação"}}.`
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
