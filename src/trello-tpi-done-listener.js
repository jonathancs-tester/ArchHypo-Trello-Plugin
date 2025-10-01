// src/trello-tpi-done-listener.js

// Este script deve ser incluído no index.html para detectar cards TPI indo para DONE
TrelloPowerUp.initialize({
  'on-moved-to-list': function (t, opts) {
    // Detecta se o card é TPI e foi para DONE
    return t.card('id', 'name', 'attachments').then(function (card) {
      if (card.name && card.name.includes('TPI') && opts.listAfter && opts.listAfter.name.toUpperCase() === 'DONE') {
        // Verifica se há attachment de Hipótese
        const hasHipoteseAttachment = (card.attachments || []).some(att => att.name && att.name.toLowerCase().includes('hipotese'));
        if (hasHipoteseAttachment) {
          // Abre modal para reclassificação
          return t.modal({
            title: 'Reclassificar Incerteza e Impacto',
            url: `./pages/reclassify.html?cardId=${card.id}`,
            height: 400
          });
        }
      }
      return null;
    });
  }
});
