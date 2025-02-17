import 'dotenv/config';

const BACKEND_URL = process.env.VITE_BACKEND_URL;
const TRELLO_API_URL = process.env.VITE_TRELLO_API_URL;
const TRELLO_LIST_ID = process.env.VITE_TRELLO_LIST_ID;
const TRELLO_KEY = process.env.VITE_TRELLO_KEY;
const TRELLO_TOKEN = process.env.VITE_TRELLO_TOKEN;

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
async function criarCard(bulletPoint, urlDoCard) {

    console.log(bulletPoint)
    if (!bulletPoint) {
        console.log("❌ Por favor, forneça um bullet point.")
        return;
    }

    try {
        const detalhes = await gerarDetalhesCard(bulletPoint); // Chama a função para obter os detalhes
        const detalhesSemNegrito = detalhes.replace(/\*\*(.*?)\*\*/g, '$1');
        const taskRegex = /Task (.*)/;
        const taskMatch = detalhesSemNegrito.match(taskRegex);

        // Atualiza a mensagem de sucesso com os detalhes gerados
        console.log(`✅ Detalhes gerados:\n${detalhes}`)

        // Criar o card no Trello automaticamente
        const response = await fetch(`${TRELLO_API_URL}?idList=${TRELLO_LIST_ID}&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${taskMatch[0]}`,
                desc: `Detalhes da tarefa: ${detalhes}\n\nURL da Incerteza: ${urlDoCard.url}` // Usando os detalhes gerados
            })
        });

        // Espera a resposta e converte para JSON
        const responseData = await response.json();
        // Extrai o id do card da resposta
        const responseCardId = responseData.id;

        // Adicionando o attachment ao card criado
        const attachmentResponse = await fetch(`${TRELLO_API_URL}/${responseCardId}/attachments?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: `${urlDoCard.url}`,
                name: "Link para Incerteza", // Você pode nomear o attachment como quiser
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
