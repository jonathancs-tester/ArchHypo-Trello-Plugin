import fetch from "node-fetch";

const GEMINI_API_KEY = "AIzaSyDij92-PQ02BGMtSR6N4Uhx-jwwlWvkhPo"; // Substitua pela sua chave válida

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
                    text: `Crie um card de incerteza com os seguintes campos:
                    - Incerteza: ${campoIncerteza}
                    - Domínio do problema
                    - Ponto de alerta
                    - Hipótese
                    - Incerteza (Muito Baixo/Baixo/Médio/Alto/Muito Alto)
                    - Impacto (Muito Baixo/Baixo/Médio/Alto/Muito Alto)
                    - Plano`
                }]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
