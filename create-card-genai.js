const BACKEND_URL = "https://elaborate-pasca-92084f.netlify.app/.netlify/functions"; 

async function gerarDetalhesCard(incerteza) {
    const response = await fetch(`${BACKEND_URL}/gerar-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campoIncerteza: incerteza })
    });

    const data = await response.json();
    return data.detalhes;
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

        const response = await fetch(`/.netlify/functions/criar-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                incerteza,
                detalhes
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

document.getElementById("botaoCriar").addEventListener("click", criarCard);
