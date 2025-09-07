  import { handleCors, corsHeaders } from './cors.js';
  import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
  import { ChatPromptTemplate } from "@langchain/core/prompts";
  import { cleanAndParseJSON } from './json-utils.js';

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
      `Dado o contexto: "{input}", classifique o nível de incerteza ("Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto") e explique o motivo utilizando o Uncertainty Historical:
      -------------------------------------------------------------
      Caso o Uncertainty Historical não tem informação, seguir a regra abaixo: 
          Muito Baixo: A hipótese é baseada em informações sólidas e bem preparadas. Há alta confiança na análise e pouca margem para erro.
          Baixo: A hipótese tem uma boa base de conhecimento e dúvida. A situação é conhecida e há evidências para apoiar a análise.
          Médio: A hipótese envolve um certo grau de incerteza. Existem dados úteis, mas ainda há pontos que requerem validação ou investigação.
          Alto: A hipótese é baseada em suposições e poucas evidências concretas. A análise requer cautela e pode envolver riscos.
          Muito Alto: A hipótese é altamente especulativa. Não há dados disponíveis e o cenário é desconhecido, exigindo investigação aprofundada.

      **Responda em: ${idiomaTexto}**

  Responda no formato JSON:
  {{"sugestao": "incerteza", "motivo": "explicação"}}.`
    );
    
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
