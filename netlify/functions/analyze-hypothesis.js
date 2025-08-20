  import { handleCors, corsHeaders } from './cors.js';
  import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
  import { ChatPromptTemplate } from "@langchain/core/prompts";
  import { franc } from 'franc';

  export async function handler(event) {
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;

    const { input } = JSON.parse(event.body);

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-lite",
      apiKey: process.env.GENAI_API_KEY,
    });

    const idioma = franc(input); // Ex: 'por', 'eng'

    const prompt = ChatPromptTemplate.fromTemplate(
    `Dado o contexto: "{input}", gere uma hipótese que explique o problema e o motivo, seguindo o exemplo abaixo:
  Incerteza: "Nova API de autenticação em um sistema legado."
  Hipótese: "Precisamos validar rapidamente se a nova API de autenticação se integra corretamente ao sistema legado para liberar o deploy da versão atual."

  ** Responda em: {idioma} **

  Responda no formato JSON :
  {{"sugestao": "hipótese gerada", "motivo": "explicação"}}`);

    
    console.log(prompt.promptMessages[0].prompt.template);
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
