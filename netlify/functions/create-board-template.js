import fetch from "node-fetch";

const TRELLO_API_URL = process.env.TRELLO_API_URL;
const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

export async function handler(event) {
    const nomesDasListas = [
        "UNCERTAINTY",
        "TECH PLAN ITEM",
        "TO DO",
        "IN PROGRESS",
        "DONE"
    ];
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
            body: JSON.stringify({ error: "Method Not Allowed" }),
        };
    }

    try {
        const { boardId } = event.queryStringParameters;

        if (!boardId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "The parameter boardId is required." })
            };
        }

        const idListRespose = await fetch(`${TRELLO_API_URL}/boards/${boardId}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        
        const idList = await idListRespose.json();

        for (const nameList of nomesDasListas) {
            const existList = idList.some(lista => lista.name.toUpperCase() === nameList.toUpperCase());

        if (!existList) {
            var response = await fetch(`${TRELLO_API_URL}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: nameList,
                    idBoard: boardId
                })
            });
        }

        if (!response.ok) {
            throw new Error(`Failed to create list or the list created: ${nameList}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Card created!", data }),
        };
    }
    } catch (error) {
        console.error("❌ Error creating card in Trello:", error.message);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
}