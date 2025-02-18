import fetch from "node-fetch";

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
        const { responseCardId, urlDoCard } = JSON.parse(event.body);
        console.log("Recebido responseCardId:", responseCardId, "e urlDoCard:", urlDoCard);

        if (!responseCardId || !urlDoCard) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: "Os campos 'responseCardId' e 'urlDoCard' são obrigatórios." }),
            };
        }

        const TRELLO_API_URL = process.env.TRELLO_API_URL;
        const TRELLO_KEY = process.env.TRELLO_KEY;
        const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

        const attachmentResponse = await fetch(`${TRELLO_API_URL}/${responseCardId}/attachments?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: urlDoCard,
                name: "Link para Incerteza",
            })
        });

        if (!attachmentResponse.ok) {
            throw new Error(`Erro da API Trello: ${attachmentResponse.status} ${attachmentResponse.statusText}`);
        }

        const data = await attachmentResponse.json();

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ mensagem: "Anexo adicionado com sucesso!", data }),
        };

    } catch (error) {
        console.error("❌ Erro ao adicionar anexo:", error.message);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ erro: error.message }),
        };
    }
}
