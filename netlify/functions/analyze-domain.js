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

    const idioma = franc(input);
    const idiomaTexto = idioma === 'por' ? 'português' : 'inglês' 

    const prompt = ChatPromptTemplate.fromTemplate(
    `Dado o contexto: "{input}", classifique o domínio do problema em ("Desempenho", "Segurança", "Confiabilidade", "Flexibilidade", "Usabilidade", "Productividade") e explique o motivo.

    **Responda em: ${idiomaTexto}**

    Formato da resposta (em JSON):
    {{"sugestao": "domínio do problema", "motivo": "explicação no mesmo idioma do input"}}.`
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
