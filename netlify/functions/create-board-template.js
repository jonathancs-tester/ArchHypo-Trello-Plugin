import fetch from "node-fetch";

const TRELLO_API_URL = process.env.TRELLO_API_URL;
const TRELLO_KEY = process.env.TRELLO_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

export async function handler(event) {
const nomesDasListas = [
"CONCLUIDO",
"EM ANDAMENTO",
"A FAZER",
"ITEM PLANO TECNICO",
"HIPÓTESES",
];

// Suporte ao CORS
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
    body: JSON.stringify({ error: "The parameter boardId is required." }),
    };
}

// Buscar listas existentes no board
const idListResponse = await fetch(
    `${TRELLO_API_URL}/boards/${boardId}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
    {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    }
);

const idList = await idListResponse.json();

// Criar listas que não existem
for (const nameList of nomesDasListas) {
    const existList = idList.some(
    (lista) => lista.name.toUpperCase() === nameList.toUpperCase()
    );

    if (!existList) {
    const response = await fetch(
        `${TRELLO_API_URL}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: nameList,
            idBoard: boardId,
        }),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to create list: ${nameList}`);
    }
    }
}

return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ message: "Lists verified/created successfully!" }),
};
} catch (error) {
console.error("❌ Error creating lists in Trello:", error.message);
return {
    statusCode: 500,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({ error: error.message }),
};
}
}