document.getElementById('create-card-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const botao = document.getElementById("botaoCriar");
    const status = document.getElementById("status");

    const dominio = document.getElementById('dominio').value.trim();
    const ponto = document.getElementById('ponto').value.trim();
    const hipotese = document.getElementById('hipotese').value.trim();
    const incerteza = document.getElementById('incerteza').value.trim();
    const impacto = document.getElementById('impacto').value.trim();
    const plano = document.getElementById('plano').value.trim();

    if (!incerteza) {
        status.innerText = "❌ Por favor, digite uma incerteza.";
        status.className = 'error';
        return;
    }

    botao.disabled = true;
    status.innerHTML = "⏳ Criando card...";
    status.className = '';

    var data = {
        name: "Incerteza: " + dominio,
        detalhes:
            "**Ponto de alerta:** " + ponto + "\\n" +
            "**Hipótese:** " + hipotese + "\\n" +
            "**Incerteza:** " + incerteza + "\\n" +
            "**Impacto:** " + impacto + "\\n" +
            "**Plano:** " + plano
    };

    try {
        const response = await fetch(`/.netlify/functions/criar-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Card criado!", result);
            status.innerText = "✅ Card criado com sucesso!";
            status.className = 'success';
        } else {
            throw new Error("Erro ao criar card");
        }
    } catch (error) {
        console.error(error);
        status.innerText = "❌ Erro ao criar o card.";
        status.className = 'error';
    } finally {
        botao.disabled = false;
    }
});
