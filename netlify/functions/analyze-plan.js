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
    `Dado o contexto: "{input}", sugira um plano de tecnico com 3 a 5 items em paragrafos separados para mitigar o problema ou tratar a hipótese, e explique o motivo.
Responda no formato JSON e **utilize o mesmo idioma do input** (por exemplo, se o input estiver em inglês, responda em inglês; se estiver em português, responda em português; se estiver em espanhol, responda em espanhol):: 
{{"sugestao": "plano de ação em paragrafos separados", "motivo": "explicação"}}.`
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
