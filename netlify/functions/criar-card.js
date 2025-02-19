import fetch from "node-fetch";

const TRELLO_API_URL = process.env.TRELLO_API_URL;
//const TRELLO_LIST_ID = process.env.TRELLO_LIST_ID;
const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

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
        const { name, detalhes } = JSON.parse(event.body);

        if (!name || !detalhes) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: "Os campos 'name' e 'detalhes' são obrigatórios." }),
            };
        }

        const { boardId } = event.queryStringParameters;

        if (!boardId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "O parâmetro boardId é obrigatório." })
            };
        }

        const response = await fetch(`${TRELLO_API_URL}?idList=${boardId}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                desc: detalhes,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao criar card no Trello: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Card criado!", data }),
        };

    } catch (error) {
        console.error("❌ Erro ao criar card no Trello:", error.message);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ erro: error.message }),
        };
    }
}