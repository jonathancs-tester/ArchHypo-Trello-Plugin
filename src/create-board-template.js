async function createBoardTemplate() {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');  // Obtém o boardId da URL

    try {
        const res = await fetch(`/.netlify/functions/create-board-template?boardId=${boardId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify('')
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