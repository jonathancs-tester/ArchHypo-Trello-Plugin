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
           const { boardId, column } = event.queryStringParameters;

            if (!boardId || !column) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "The parameters boardId and column are required." })
                };
            }

            const idListRespose = await fetch(`${TRELLO_API_URL}/boards/${boardId}/lists?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            
            const idList = await idListRespose.json();
            let idDaListaEncontrada = null;

            // Verifica se existe uma lista com nome igual ao da coluna
            for (const lista of idList) {
            if (lista.name.toUpperCase() === column.toUpperCase()) {
                    idDaListaEncontrada = lista.id;
                    break;
                }
            }

            // Se encontrou, faz o fetch usando o id da lista
            if (idDaListaEncontrada) {
                const cardsRes = await fetch(
                    `${TRELLO_API_URL}/boards/${boardId}/cards?idList=${idDaListaEncontrada}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`,
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
                    const hypoMatch = card.name.match(/Hypothesis\s*:\s*(.+)/i);
                    const impactMatch = card.desc.match(/Impact\s*:\s*(.+)/i);

                    return {
                        hipotese: hypoMatch ? hypoMatch[1].trim() : null,
                        impacto: impactMatch ? impactMatch[1].trim() : null
                    };
                });

                return {
                    statusCode: 200,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify(result),
                };
            }
        } catch (error) {
            console.error("❌ Error:", error.message);
            return {
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: error.message }),
            };
        }
    }
