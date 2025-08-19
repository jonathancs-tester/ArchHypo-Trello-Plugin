// Função que chama o backend para gerar os detalhes do card
async function gerarDetalhesCard(plano) {
    const response = await fetch(`/.netlify/functions/generate-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campoPlano: plano })
    });

    const data = await response.json();
    return data.detalhes; // Retorna os detalhes gerados
}

// Função para criar o card no Trello
async function criarCard(bulletPoint, urlDoCard, boardId) {

    if (!bulletPoint) {
        console.log("❌ Please provide a bullet point.")
        return;
    }

    try {
        const detalhes = await gerarDetalhesCard(bulletPoint); // Chama a função para obter os detalhes
        const taskRegex = /Task:\s*(.*)/;
        const taskMatch = detalhes.match(taskRegex);

        // Atualiza a mensagem de sucesso com os detalhes gerados
        console.log(`✅ Generated details:\n${detalhes}`)

        const response = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&collumn=1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: `${taskMatch[0]}`,
                detalhes: `Task details:\n\n ${detalhes}\n\nUncertainty Link: ${urlDoCard.url}}` // Usando os detalhes gerados
            })
        });
        
        // Espera a resposta e converte para JSON
        const responseData = await response.json();

        const attachmentResponse = await fetch(`/.netlify/functions/attachment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                responseCardId: responseData.data.id,  // Verifique se o id está aqui
                urlDoCard: `${urlDoCard.url}`  // Verifique se a URL está correta
            })
        });        

        // Verifica se a criação do card foi bem-sucedida
        if (attachmentResponse.ok) 
            console.log("✅ Task created successfully on Trello!");
        else 
            throw new Error('Failed to create card on Trello');
        } catch (error) {
            console.error(error);
            console.log("❌ Error generating/creating the task.");
        return t.popup({
            title: 'Error',
            items: [{ icon: 'https://img.icons8.com/ios/50/000000/error.png', text: `Error creating task: ${error.message || 'Unknown error'}` }]
        });
    }
}
