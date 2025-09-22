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

    // Usar a função de parse robusto sem fallback para detectar erros
    const parsedResult = cleanAndParseJSON(result.content);
    
    // Verificar se o parsing foi bem-sucedido
    if (!parsedResult || !parsedResult.sugestao || parsedResult.sugestao.includes("Erro ao processar")) {
      console.error("❌ Falha na geração do plano técnico:", result.content.substring(0, 200));
      
      return {
        statusCode: 422, // Unprocessable Entity
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Falha na geração do plano técnico",
          message: "A IA não conseguiu processar o contexto fornecido. Tente reformular ou fornecer mais detalhes.",
          retry: true
        }),
      };
    }

    const { sugestao, motivo, justificativa, descricao, tradeoff } = parsedResult;

    // Validar campos obrigatórios
    if (!sugestao || !motivo || !justificativa || !descricao) {
      console.error("❌ Resposta da IA incompleta:", parsedResult);
      
      return {
        statusCode: 422,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Resposta incompleta da IA",
          message: "Nem todos os campos necessários foram gerados. Tente novamente.",
          retry: true
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sugestao, motivo, justificativa, descricao, tradeoff }),
    };
  }
