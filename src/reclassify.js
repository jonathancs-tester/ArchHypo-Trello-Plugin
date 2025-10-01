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

  if (window.TrelloPowerUp) {
    const t = window.TrelloPowerUp.iframe();
    await t.set('card', 'shared', {
      incerteza,
      impacto,
      justificativa_reclassificacao: justificativa
    });

    // Buscar o attachment do card de hipótese
    const card = await t.card('attachments');
    let hypothesisCardUrl = null;
    if (card && card.attachments && card.attachments.length > 0) {
      // Pega o primeiro attachment que seja um link de card do Trello
      const hypoAtt = card.attachments.find(att => att.url && att.url.includes('trello.com/c/'));
      if (hypoAtt) {
        hypothesisCardUrl = hypoAtt.url;
      }
    }


    if (hypothesisCardUrl) {
      // Chama a função serverless para atualizar a descrição do card de hipótese
      try {
        const uncertaintyLabel = window.I18N ? window.I18N.t('uncertaintyLevelLabel').trim() : '**Nível de Incerteza:**';
        const impactLabel = window.I18N ? window.I18N.t('impactLevelLabel').trim() : '**Nível de Impacto:**';
        await fetch('/.netlify/functions/update-hypothesis-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hypothesisCardUrl, incerteza, impacto, uncertaintyLabel, impactLabel })
        });
      } catch (err) {
        alert('Erro ao atualizar card de hipótese: ' + err.message);
      }
    }

    t.closeModal();
  } else {
    alert('Erro: Power-Up não detectado.');
  }
});
