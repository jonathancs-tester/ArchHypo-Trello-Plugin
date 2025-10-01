// src/reclassify.js

// Função utilitária para obter parâmetros da URL
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

document.getElementById('reclassifyForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const incerteza = document.getElementById('incerteza').value;
  const impacto = document.getElementById('impacto').value;
  const justificativa = document.getElementById('justificativa').value;

  // Parâmetros do Trello Power-Up
  if (window.TrelloPowerUp) {
    const t = window.TrelloPowerUp.iframe();
    await t.set('card', 'shared', {
      incerteza,
      impacto,
      justificativa_reclassificacao: justificativa
    });
    t.closeModal();
  } else {
    alert('Erro: Power-Up não detectado.');
  }
});
