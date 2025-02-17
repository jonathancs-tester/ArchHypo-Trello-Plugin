const BACKEND_URL = "https://elaborate-pasca-92084f.netlify.app/.netlify/functions"; // Chama nosso servidor backend
const TRELLO_API_URL = "https://api.trello.com/1/cards";
const TRELLO_LIST_ID = "6692d2e23c532f46419fc230"; // ID da lista no Trello
const TRELLO_KEY = "eb9d96c766c0a0ba5b9a4db8e940ed4d";
const TRELLO_TOKEN = "ATTA3d2621b57146b60ce3b3fa21dc193ad525c1d94ee2bfef004d1a24ed958a92332C751758";

async function gerarDetalhesCard(incerteza) {
    const response = await fetch(`${BACKEND_URL}/gerar-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campoIncerteza: incerteza })
    });

    const data = await response.json();
    return data.detalhes; // Retorna os detalhes gerados
}

async function criarCard(bulletPoint) {
    const status = document.getElementById("status");

    if (!bulletPoint) {
        status.innerText = "❌ Por favor, forneça um bullet point.";
        status.className = 'error';
        return;
    }

    status.innerHTML = "⏳ Gerando detalhes do card...";
    status.className = '';

    try {
        //const detalhes = await gerarDetalhesCard(bulletPoint);

        status.innerText = `✅ Detalhes gerados:\n${detalhes}`;
        status.className = 'success';

        // Criar card no Trello automaticamente
        await fetch(`${TRELLO_API_URL}?idList=${TRELLO_LIST_ID}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `Task: ${bulletPoint}`,
                desc: 'detalhes'
            })
        });

        status.innerText = "✅ Task criada no Trello com sucesso!";
    } catch (error) {
        console.error(error);
        status.innerText = "❌ Erro ao gerar/criar a task.";
        status.className = 'error';
    } finally {
        botao.disabled = false;
    }
}
