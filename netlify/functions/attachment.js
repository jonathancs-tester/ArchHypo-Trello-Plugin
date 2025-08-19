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

            if (!responseCardId || !urlDoCard) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ erro: "The fields 'responseCardId' and 'urlDoCard' are required." }),
                };
            }

            const TRELLO_API_URL = process.env.TRELLO_API_URL;
            const TRELLO_KEY = process.env.TRELLO_KEY;
            const TRELLO_TOKEN = process.env.TRELLO_TOKEN;

            const attachmentResponse = await fetch(`${TRELLO_API_URL}/cards/${responseCardId}/attachments?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: urlDoCard,
                    name: "Uncertainty Link",
                })
            });

            if (!attachmentResponse.ok) {
                throw new Error(`API Trello Error: ${attachmentResponse.status} ${attachmentResponse.statusText}`);
            }

            const data = await attachmentResponse.json();

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ mensagem: "Attachment added!", data }),
            };

        } catch (error) {
            console.error("❌ Error adding attachment:", error.message);
            return {
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: error.message }),
            };
        }
    }
