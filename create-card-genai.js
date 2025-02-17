const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const TRELLO_API_URL = import.meta.env.VITE_TRELLO_API_UR;
const TRELLO_LIST_ID = import.meta.env.VITE_TRELLO_LIST_IDL;
const TRELLO_KEY = import.meta.env.VITE_TRELLO_KEY;
const TRELLO_TOKEN = import.meta.env.VITE_TRELLO_TOKEN;

async function gerarDetalhesCard(incerteza) {
    const response = await fetch(`${BACKEND_URL}/gerar-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campoIncerteza: incerteza })
    });

    const data = await response.json();
    return data.detalhes; // Retorna os detalhes gerados
}

async function criarCard() {
    const incerteza = document.getElementById("incerteza").value.trim();
    const botao = document.getElementById("botaoCriar");
    const status = document.getElementById("status");

    if (!incerteza) {
        status.innerText = "❌ Por favor, digite uma incerteza.";
        status.className = 'error';
        return;
    }

    botao.disabled = true;
    status.innerHTML = "⏳ Gerando detalhes do card...";
    status.className = '';

    try {
        const detalhes = await gerarDetalhesCard(incerteza);

        status.innerText = `✅ Detalhes gerados:\n${detalhes}`;
        status.className = 'success';

        // Criar card no Trello automaticamente
        await fetch(`${TRELLO_API_URL}?idList=${TRELLO_LIST_ID}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `Incerteza: ${incerteza}`,
                desc: detalhes
            })
        });

        status.innerText = "✅ Card criado no Trello com sucesso!";
    } catch (error) {
        console.error(error);
        status.innerText = "❌ Erro ao gerar/criar o card.";
        status.className = 'error';
    } finally {
        botao.disabled = false;
    }
}
