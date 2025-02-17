const BACKEND_URL = "https://elaborate-pasca-92084f.netlify.app/.netlify/functions"; // Chama nosso servidor backend
const TRELLO_API_URL = "https://api.trello.com/1/cards";
const TRELLO_LIST_ID = "6692d2e23c532f46419fc230"; // ID da lista no Trello
const TRELLO_KEY = "eb9d96c766c0a0ba5b9a4db8e940ed4d";
const TRELLO_TOKEN = "ATTA3d2621b57146b60ce3b3fa21dc193ad525c1d94ee2bfef004d1a24ed958a92332C751758";

// Função que chama o backend para gerar os detalhes do card
async function gerarDetalhesCard(plano) {
    const response = await fetch(`${BACKEND_URL}/gerar-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campoPlano: plano })
    });

    const data = await response.json();
    return data.detalhes; // Retorna os detalhes gerados
}

// Função para criar o card no Trello
async function criarCard(bulletPoint) {

    console.log(bulletPoint)
    if (!bulletPoint) {
        console.log("❌ Por favor, forneça um bullet point.")
        return;
    }

    try {
        const detalhes = await gerarDetalhesCard(bulletPoint); // Chama a função para obter os detalhes

        // Atualiza a mensagem de sucesso com os detalhes gerados
        console.log(`✅ Detalhes gerados:\n${detalhes}`)

        // Criar o card no Trello automaticamente
        const response = await fetch(`${TRELLO_API_URL}?idList=${TRELLO_LIST_ID}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `Task: ${bulletPoint}`,
                desc: detalhes // Usando os detalhes gerados
            })
        });

        // Verifica se a criação do card foi bem-sucedida
        if (response.ok) {
             console.log("✅ Task criada no Trello com sucesso!")
        } else {
            throw new Error('Falha ao criar card no Trello');
        }
    } catch (error) {
        console.error(error);
         console.log("❌ Erro ao gerar/criar a task.")
    }
}
