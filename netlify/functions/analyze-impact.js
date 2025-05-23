import { handleCors, corsHeaders } from './cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export async function handler(event) {
    const corsResponse = handleCors(event);
    if (corsResponse) return corsResponse;

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    try {
        const { hipotese } = JSON.parse(event.body);

        const model = new ChatGoogleGenerativeAI({
            model: "gemini-1.5-flash",
            apiKey: process.env.GENAI_API_KEY,
        });

        const prompt = ChatPromptTemplate.fromTemplate(
            `Dada a hipótese: {hipotese}, classifique o impacto (baixo, médio ou alto) e explique o motivo da escolha.
            Responda somente um JSON válido, sem quebras de linha, no formato:
            {{"impacto": "baixo|medio|alto", "motivo": "explicação do motivo"}}.`
        );

        const chain = prompt.pipe(model);

        const result = await chain.invoke({ hipotese });

        let parsed;
        try {
            parsed = JSON.parse(result.content);
        } catch (e) {
            console.error("Erro ao fazer parse da resposta do Gemini:", result.content);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: "Erro no formato da resposta do Gemini", resposta: result.content }),
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                impacto: parsed.impacto,
                motivo: parsed.motivo,
            }),
        };

    } catch (error) {
        console.error("Erro:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: error.message }),
        };
    }
}
