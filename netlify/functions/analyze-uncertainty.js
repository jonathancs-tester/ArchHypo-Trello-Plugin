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
    const prompt = ChatPromptTemplate.fromTemplate(
      `Dado o contexto: "{input}", classifique o nível de incerteza e explique o motivo utilizando o Uncertainty Historical:
      -------------------------------------------------------------
      Caso o Uncertainty Historical não tem informação, seguir a regra abaixo: 
        Very Low: The hypothesis is based on solid, well-prepared information. There is high confidence in the analysis and little margin for error.
        Low: The hypothesis has a good basis of knowledge and doubt. The situation is known, and there is evidence to support the analysis.
        Medium: The hypothesis involves a certain degree of uncertainty. There is helpful data, but there are still points that require validation or investigation.
        High: The hypothesis is based on assumptions and little concrete evidence. The analysis requires caution and may involve risks.
        Very High: The hypothesis is highly speculative. There is no data available and the scenario is unknown, requiring in-depth investigation.
      
  Responda no formato JSON:
  {{"sugestao": "Very Low|Low|Medium|High|Very High", "motivo": "explicação em: ${idioma}"}}.`
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
