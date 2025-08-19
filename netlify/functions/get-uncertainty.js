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
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
            const { boardId } = event.queryStringParameters || {};

            if (!boardId) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ erro: "The parameter boardId is required." }),
                };
            }

            // 1️⃣ Pega todos os cards do board
            const cardsRes = await fetch(
                `${TRELLO_API_URL}/boards/${boardId}/cards?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
                { method: "GET" }
            );

            if (!cardsRes.ok) {
                throw new Error(`Error fetching cards: ${cardsRes.status} ${cardsRes.statusText}`);
            }

            const cards = await cardsRes.json();

            if (!cards.length) {
                return {
                    statusCode: 200,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify(null),
                };
            }

            // 2️⃣ Pega apenas os 10 primeiros
            const firstTen = cards.slice(0, 10);

            // 3️⃣ Extrai "hipotese" e "impact" do campo desc (ou de labels se você armazenar lá)
            const result = firstTen.map(card => {
                const hypoMatch = card.desc.match(/Hypothesis\s*:\s*(.+)/i);
                const uncertaintyMatch = card.desc.match(/Uncertainty\s*:\s*(.+)/i);

                return {
                    hipotese: hypoMatch ? hypoMatch[1].trim() : null,
                    impacto: uncertaintyMatch ? uncertaintyMatch[1].trim() : null
                };
            });

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(result),
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
