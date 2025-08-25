    import fetch from "node-fetch";

    const TRELLO_API_URL = process.env.TRELLO_API_URL;
    const TRELLO_KEY = process.env.TRELLO_KEY;
    const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

    export async function handler(event) {
        if (event.httpMethod === "OPTIONS") {
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
                body: "",
            };
        }

        if (event.httpMethod !== "GET") {
            return {
                statusCode: 405,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: "Method Not Allowed" }),
            };
        }

        try {
            const { cardId } = event.queryStringParameters || {};

            if (!cardId) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ erro: "The parameter cardId is required." }),
                };
            }

            const cardRes = await fetch(
                `${TRELLO_API_URL}/cards/${cardId}?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
                { method: "GET" }
            );

            if (!cardRes.ok) {
                throw new Error(`Error fetching card: ${cardRes.status} ${cardRes.statusText}`);
            }

            const card = await cardRes.json();
            console.log(card);

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ title: card.title, description: card.desc }),
            };

        } catch (error) {
            console.error("❌ Error:", error.message);
            return {
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: error.message }),
            };
        }
    }
