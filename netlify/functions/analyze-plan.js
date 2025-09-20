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
      `Dado o contexto: "{input}", sugira somente um plano tecnico com 3 a 5 items separados **obrigatoriamente pela string '\\n'** e sem numero do item no inicio para mitigar o problema ou tratar a hipótese, e explique o motivo.

      **Responda em: ${idiomaTexto}**

      Responda no formato JSON: 
  {{"sugestao": "plano tecnico", "motivo": "explicação", "justificativa": "objetivo", "descricao": "o que deve ser feito", "tradeoff": "quais sao os tradeoff/observações" }}.`
    );

    const chain = prompt.pipe(model);
    const result = await chain.invoke({ input });

    // Usar a função de parse robusto com fallback específico
    const fallbackData = {
      sugestao: "Erro ao processar resposta da IA. Tente novamente.",
      motivo: "Falha na geração do plano técnico",
      justificativa: "Sistema indisponível temporariamente",
      descricao: "Tente novamente em alguns segundos",
      tradeoff: "N/A"
    };
    
    const parsedResult = cleanAndParseJSON(result.content, fallbackData);
    const { sugestao, motivo, justificativa, descricao, tradeoff } = parsedResult;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sugestao, motivo, justificativa, descricao, tradeoff }),
    };
  }
