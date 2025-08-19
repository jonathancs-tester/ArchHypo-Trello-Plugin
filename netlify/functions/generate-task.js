    import fetch from "node-fetch";

    const GENAI_API_KEY = process.env.GENAI_API_KEY;
    const GENAI_URL = process.env.GENAI_URL;
    const NON_FUNCTIONAL = process.env.NON_FUNCTIONAL;
    const PATTERN = process.env.PATTERN;

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
                body: JSON.stringify({ erro: "Method Not Allowed" }),
            };
        }

        try {
            const { campoPlano } = JSON.parse(event.body);

            if (!campoPlano) {
                return {
                    statusCode: 400,
                    headers: { "Access-Control-Allow-Origin": "*" },
                    body: JSON.stringify({ erro: "The field 'campoPlano' is required." }),
                };
            }

            const prompt = {
                contents: [{
                    parts: [{
                        text: `Crie uma task unica baseado em cada tópico do plano tecnico: ${campoPlano} com somente os campos (sem tabela e sem negrito):
                        Task: 
                        - Goal: (como deve ser realizado a task)
                        - Non Functional Requirement(${NON_FUNCTIONAL}): somente um valor
                        - ArchHypo Pattern (${PATTERN}): somente um valor`
                    }]
                }]
            };

            const response = await fetch(`${GENAI_URL}?key=${GENAI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prompt)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
                throw new Error("Unexpected API response");
            }

            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" }, // Permite chamadas de qualquer domínio
                body: JSON.stringify({ detalhes: data.candidates[0].content.parts[0].text }),
            };

        } catch (error) {
            console.error("❌ Error generating card:", error.message);
            return {
                statusCode: 500,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ erro: error.message }),
            };
        }
    }
