import fetch from "node-fetch";

const GENAI_API_KEY = import.meta.env.VITE_GENAI_API_KEY;
const GENAI_URL = import.meta.env.VITE_GENAI_URL;

export async function handler(event) {
    // Permitir requisições OPTIONS para suporte ao CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            body: "",
        };
    }

    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ erro: "Método não permitido" }),
        };
    }

    try {
        const { campoPlano } = JSON.parse(event.body);

        if (!campoPlano) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: "O campo 'campoPlano' é obrigatório." }),
            };
        }

        const prompt = {
            contents: [{
                parts: [{
                    text: `Crie uma task unica baseado em cada tópico do plano tecnico: ${campoPlano} com somente os campos (sem tabela e sem negrito):
                    - Objetivo: (como deve ser realizado a task)
                    - Requisito Não Funcional(Performance/Segurança/Confiabilidade/Flexibilidade/Usabilidade/Produtividade): somente um valor
                    - Pattern (Software Analytics/Architectural Spike/Tracer Bullet/Architectural Trigger/Solution Candidate/GuideLine Implementation): somente um valor`
                }]
            }]
        };

        const response = await fetch(`${GENAI_URL}?key=${GENAI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prompt)
        });

        if (!response.ok) {
            throw new Error(`Erro da API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error("Resposta inesperada da API");
        }

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" }, // Permite chamadas de qualquer domínio
            body: JSON.stringify({ detalhes: data.candidates[0].content.parts[0].text }),
        };

    } catch (error) {
        console.error("❌ Erro ao gerar card:", error.message);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ erro: error.message }),
        };
    }
}
