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
    `Dada a seguinte descrição: "{input}", classifique o nível de incerteza e explique o motivo, seguindo o exemplo abaixo: 
        Muito Baixo: Quase certeza, muito conhecido.
        Baixo: Pouca dúvida, bem compreendido.
        Médio: Existe dúvida, mas alguns dados já ajudam.
        Alto: Considerável incerteza, não temos dados sólidos.
        Muito Alto: É praticamente uma aposta, não temos dados, é um completo desconhecido.
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
