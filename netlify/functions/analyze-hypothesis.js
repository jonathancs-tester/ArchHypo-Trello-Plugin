  import { handleCors, corsHeaders } from './utils/cors.js';
  import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
  import { ChatPromptTemplate } from "@langchain/core/prompts";
  import { cleanAndParseJSON } from './utils/json-utils.js';

  export async function handler(event) {
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;

    const { input, language = 'pt' } = JSON.parse(event.body);

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-lite",
      apiKey: process.env.GENAI_API_KEY,
    });

    // Usar idioma enviado pelo frontend em vez de detecção automática
    const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

    const prompt = ChatPromptTemplate.fromTemplate(
    `Dado o contexto: "{input}", gere uma hipótese que explique o problema e o motivo, seguindo o exemplo abaixo:
  Incerteza: "Nova API de autenticação em um sistema legado."
  Hipótese: "Precisamos validar rapidamente se a nova API de autenticação se integra corretamente ao sistema legado para liberar o deploy da versão atual."

  **Responda em: ${idiomaTexto}**

  Responda no formato JSON :
  {{"sugestao": "hipótese gerada", "motivo": "explicação"}}`);

    const chain = prompt.pipe(model);
    const result = await chain.invoke({ input });

    // Usar a função de parse robusto
    const parsedResult = cleanAndParseJSON(result.content);
    const { sugestao, motivo } = parsedResult;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sugestao, motivo }),
    };
  }
