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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ erro: "Method Not Allowed" }),
    };
  }

  try {
    const { hypothesisCardUrl, incerteza, impacto } = JSON.parse(event.body);
    if (!hypothesisCardUrl || !incerteza || !impacto) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ erro: "Missing required fields." }),
      };
    }

    // Extrai o cardId do link (https://trello.com/c/{cardId})
    const match = hypothesisCardUrl.match(/trello.com\/c\/([a-zA-Z0-9]+)/);
    if (!match) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ erro: "Invalid card URL." }),
      };
    }
    const cardId = match[1];

    // Busca a descrição atual
    const cardRes = await fetch(`${TRELLO_API_URL}/cards/${cardId}?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`);
    if (!cardRes.ok) {
      throw new Error(`Error fetching card: ${cardRes.status} ${cardRes.statusText}`);
    }
    const card = await cardRes.json();
    let desc = card.desc || "";

    // Atualiza os campos na descrição
    desc = desc.replace(/(\*\*Nível de Incerteza:\*\*).*/i, `**Nível de Incerteza:** ${incerteza}`);
    desc = desc.replace(/(\*\*Nível de Impacto:\*\*).*/i, `**Nível de Impacto:** ${impacto}`);

    // Salva a nova descrição
    const updateRes = await fetch(`${TRELLO_API_URL}/cards/${cardId}?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desc }),
    });
    if (!updateRes.ok) {
      throw new Error(`Error updating card: ${updateRes.status} ${updateRes.statusText}`);
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Card updated!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ erro: error.message }),
    };
  }
}
