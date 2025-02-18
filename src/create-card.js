document.getElementById('create-card-form').addEventListener('submit', function (e) {
    e.preventDefault();

    var data = {
        name: "Incerteza: " + document.getElementById('dominio').value,
        detalhes: 
            "**Ponto de alerta:** " + document.getElementById('ponto').value + "\\n" +
            "**Hipótese:** " + document.getElementById('hipotese').value + "\\n" +
            "**Incerteza:** " + document.getElementById('incerteza').value + "\\n" +
            "**Impacto:** " + document.getElementById('impacto').value + "\\n" +
            "**Plano:** " + document.getElementById('plano').value
    };

    // Enviar os dados para a função Netlify
    fetch(`/.netlify/functions/criar-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(function (result) {
        console.log("Card criado!", result);
    })
    .catch(function (error) {
        console.error("Erro ao criar card:", error);
    });
});
