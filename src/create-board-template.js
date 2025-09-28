    async function createBoardTemplate(boardId) {
        try {
            const res = await fetch(`/.netlify/functions/create-board-template?boardId=${boardId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`${I18N.t('createCardError')} ${result.error || result.erro || I18N.t('unknownError')}`);
                return;
            }

        } catch (error) {
            console.error('❌ Request error:', error);
            alert(`${I18N.t('createCardError')} ${I18N.t('checkConsole')}`);
        }
    }