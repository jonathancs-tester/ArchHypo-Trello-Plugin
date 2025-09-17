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

    const idioma = franc(input.description); // Ex: 'por', 'eng'
    const idiomaTexto = idioma === 'por' ? 'português' : 'inglês'
    const prompt = ChatPromptTemplate.fromTemplate(
      `Dado o contexto: "{input}", sugira somente um plano tecnico com 3 a 5 items separados **obrigatoriamente pela string '\\n'** e sem numero do item no inicio para mitigar o problema ou tratar a hipótese, e explique o motivo.

      **Responda em: português**

      Responda no formato JSON: 
  {{"sugestao": "plano tecnico", "motivo": "explicação", "justificativa": "objetivo", "descricao": "o que deve ser feito", "tradeoff": "quais sao os tradeoff/observações" }}.`
    );

    const chain = prompt.pipe(model);
    const result = await chain.invoke({ input });

    let cleaned = result.content.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/```json|```/gi, "").trim();
    }

    const { sugestao, motivo, justificativa, descricao, tradeoff } = JSON.parse(cleaned);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ sugestao, motivo, justificativa, descricao, tradeoff }),
    };
  }
