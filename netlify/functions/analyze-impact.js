  // Igual ao de incerteza, só muda o prompt:
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
      `Dado o contexto: "{input}", classifique o impacto ("Muito Baixo", "Baixo", "Médio", "Alto", "Muito Alto") e explique o motivo utilizando o Impact Historical: 
      -------------------------------------------------------------
    Caso o Impact Historical não tenha informação, seguir a regra abaixo:  
      Muito Baixo: A situação é clara e bem compreendida. Há dados sólidos e experiência anterior que confirmam o comportamento esperado.
      Baixo: Há pouca incerteza. O problema é conhecido e já existem soluções testadas ou documentadas.
      Médio: A situação é moderadamente complexa. Existem dados úteis na análise, mas ainda há pontos que requerem validação.
      Alto: O problema é significativo e afeta áreas críticas. Há poucas evidências concretas, e uma solução pode exigir investigação ou testes.
      Muito Alto: A situação é altamente incerta. Não há dados disponíveis, e o impacto pode ser imprevisível. Exige análise aprofundada e cautela.
    
    **Responda em: ${idiomaTexto}**

  Responda no formato JSON: 
  {{"sugestao": "impacto", "motivo": "explicação"}}.`
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
