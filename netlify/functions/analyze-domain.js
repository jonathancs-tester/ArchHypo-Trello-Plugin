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
    `Dado o contexto: "{input}", identifique o domínio do problema ("Desempenho", "Segurança", "Confiabilidade", "Flexibilidade", "Usabilidade", "Productividade") e explique o motivo.

    **Responda em: ${idiomaTexto}**

    Use este mapeamento para traduzir o domínio do problema para português, se necessário:
    - Performance → Desempenho
    - Security → Segurança
    - Reliability → Confiabilidade
    - Flexibility → Flexibilidade
    - Usability → Usabilidade
    - Productivity → Produtividade

    Formato da resposta (em JSON):
    {{"sugestao": "domínio do problema", "motivo": "explicação no mesmo idioma do input"}}.`
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
