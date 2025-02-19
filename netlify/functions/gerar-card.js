import fetch from "node-fetch";

const GENAI_API_KEY = process.env.GENAI_API_KEY;
const GENAI_URL = process.env.GENAI_URL;

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
        const { campoIncerteza } = JSON.parse(event.body);

        if (!campoIncerteza) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: "O campo 'campoIncerteza' é obrigatório." }),
            };
        }

        const prompt = {
            contents: [{
                parts: [{
                    text: `Crie um card de Incerteza: ${campoIncerteza} com os seguintes campos:
                    - Domínio do problema(Performance/Segurança/Confiabilidade/Flexibilidade/Usabilidade/Produtividade): pode ser um ou mais valores
                    - Ponto de alerta (uma unica frase)
                    - Hipótese (uma unica frase)
                    - Incerteza (Muito Baixo/Baixo/Médio/Alto/Muito Alto)
                    - Impacto (Muito Baixo/Baixo/Médio/Alto/Muito Alto)
                    - Plano (criar conforme o exemplo: Plano:
                        Item 1: item 1
                        Item 2: item 2`
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
