// Função que chama o backend para gerar os detalhes do card
async function gerarDetalhesCard(plano) {
    const response = await fetch(`/.netlify/functions/gerar-task`, {
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
        const taskRegex = /Task:\s*(.*)/;
        const taskMatch = detalhes.match(taskRegex);

        // Atualiza a mensagem de sucesso com os detalhes gerados
        console.log(`✅ Detalhes gerados:\n${detalhes}`)

        const response = await fetch(`/.netlify/functions/criar-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${taskMatch[0]}`,
                detalhes: `Detalhes da tarefa:\n\n ${detalhes}\n\nURL da Incerteza: ${urlDoCard.url}` // Usando os detalhes gerados
            })
        });
        
        // Espera a resposta e converte para JSON
        const responseData = await response.json();
        // Extrai o id do card da resposta
        const responseCardId = responseData.id;

        const attachmentResponse = await fetch(`/.netlify/functions/attachment`, {
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
