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
  {
  "Very Low": {
    "impacto": "Afeta minimamente a arquitetura.",
    "incerteza": "Quase certeza, bem conhecido.",
    "descricao": "A situação é clara e bem compreendida. Há dados sólidos e experiências anteriores que confirmam o comportamento esperado."
  },
  "Low": {
    "impacto": "Pequeno impacto, fácil de corrigir.",
    "incerteza": "Pouca dúvida, bem entendido.",
    "descricao": "Há poucas incertezas. O problema é conhecido e existem soluções já testadas ou documentadas."
  },
  "Medium": {
    "impacto": "Afeta alguns componentes ou funcionalidades.",
    "incerteza": "Alguma dúvida existe, mas há dados que ajudam.",
    "descricao": "A situação apresenta complexidade moderada. Existem dados que ajudam na análise, mas ainda há pontos que precisam de validação."
  },
  "High": {
    "impacto": "Afeta partes importantes da arquitetura.",
    "incerteza": "Considerável incerteza, sem dados sólidos.",
    "descricao": "O problema é significativo e afeta áreas críticas. Há pouca evidência concreta e a solução pode exigir investigação ou testes."
  },
  "Very High": {
    "impacto": "Pode comprometer completamente o sistema, colocar o projeto em risco ou causar grandes perdas.",
    "incerteza": "É praticamente um palpite, sem dados, completamente desconhecido.",
    "descricao": "A situação é altamente incerta. Não há dados disponíveis e o impacto pode ser imprevisível. Requer análise profunda e cautela."
  }
}
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
