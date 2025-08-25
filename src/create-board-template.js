    async function createBoardTemplate(boardId) {
        try {
            console.log("🚀 Chamando a função createBoardTemplate...");

            const res = await fetch(`/.netlify/functions/create-board-template?boardId=${boardId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const result = await res.json();

            if (!res.ok) {
                alert(`Error creating card: ${result.error || result.erro || 'Unknown error'}`);
                return;
            }

        } catch (error) {
            console.error('❌ Request error:', error);
            alert('Error creating the card. Check the console for more details.');
        }
    }