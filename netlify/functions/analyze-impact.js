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
   Very Low: The situation is clear and well understood. There is solid data and previous experience that confirm the expected behavior.
   Low: There is little uncertainty. The problem is known and there are already tested or documented solutions.
   Medium: The situation is moderately complex. There is helpful data in the analysis, but there are still points that require validation.
   High: The problem is significant and affects critical areas. There is little concrete evidence, and a solution may require investigation or testing.
   Very High: The situation is highly uncertain. There is no data available, and the impact may be unpredictable. It requires in-depth analysis and caution.
     
Responda no formato JSON e **utilize o mesmo idioma do input** (por exemplo, se o input estiver em inglês, responda em inglês; se estiver em português, responda em português; se estiver em espanhol, responda em espanhol):
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
