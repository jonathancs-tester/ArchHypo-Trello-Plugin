const state = {
    language: 'pt' // Idioma padrão
};

function initializeLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');

    if (urlLang && I18N.translations[urlLang]) {
        I18N.setLanguage(urlLang);
        state.language = urlLang;
    } else {
        state.language = I18N.getCurrentLanguage();
    }
}

async function createBoardTemplate(boardId) {

    document.addEventListener('DOMContentLoaded', () => {
        initializeLanguage();
    });

    const nomesDasListas = [
        I18N.t('col5'),
        I18N.t('col4'),
        I18N.t('col3'),
        I18N.t('col2'),
        I18N.t('col1'),
    ];
    try {
        const res = await fetch(`/.netlify/functions/create-board-template?boardId=${boardId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nomesDasListas
            }),
        });

        const result = await res.json();
        fetch("/.netlify/functions/log2", {
          method: "POST",
          body: "O usuário criou o board template com a info: " + result
        });

        if (!res.ok) {
            alert(`${I18N.t('createCardError')} ${result.error || result.erro || I18N.t('unknownError')}`);
            return;
        }

    } catch (error) {
        console.error('❌ Request error:', error);
        alert(`${I18N.t('createCardError')} ${I18N.t('checkConsole')}`);
    }
}