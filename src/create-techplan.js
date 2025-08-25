   const state = {
      justificativa: '',
      descricao: '',
      tradeoff: ''
    };
    
    let currentStep = 0;
    var cardId = '';

    function getBoardIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.get('boardId');
    }

    function getCardIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      return params.get('cardId');
    }

    function showStep(stepId) {
      currentStep = stepId;
      document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
      const stepElement = document.getElementById('step' + stepId);
      if (stepElement) {
        stepElement.classList.add('active');
      }
    }

    function previousStep() {
      const confirmLeave = window.confirm("As informações preenchidas serão perdidas. Deseja voltar mesmo assim?");
      if (confirmLeave && currentStep >= 0) {
        showStep(currentStep - 1);
      }
    }

    function showLoading(stepId) {
      document.getElementById(`loading${stepId}`).style.display = 'block';
      disableButtons();
    }

    function hideLoading(stepId) {
      document.getElementById(`loading${stepId}`).style.display = 'none';
      enableButtons();
    }

    function disableButtons() {
      document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }

    function enableButtons() {
      document.querySelectorAll('button').forEach(btn => btn.disabled = false);
    }

    async function callEndpoint(endpoint, input) { 
      const res = await fetch(`/.netlify/functions/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      return data;
    }

    async function analyzePlan() {
      showLoading(0);

      cardId = getCardIdFromUrl();
      const res = await fetch(`/.netlify/functions/get-card-detail?cardId=${cardId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      const input = await res.json();

      const { sugestao, motivo, justificativa, descricao, tradeoff } = await callEndpoint('analyze-plan', input);
      state.justificativa = justificativa;
      state.descricao = descricao;
      state.tradeoff = tradeoff;

      let itens = [];

      if (sugestao.includes('\n'))
        itens = sugestao.split('\n');
      else if (sugestao.includes(';'))
        itens = sugestao.split(';');
      else if (sugestao.includes('.')) 
        itens = sugestao.split('.');
      else if (sugestao.includes(',')) 
        itens = sugestao.split(',');
      else 
        itens = sugestao.split("'");

      itens = itens.map(item => item.trim()).filter(item => item !== '');

      const nextButton = document.querySelector('button[onclick="classifyPattern()"]');

      if (itens.length > 0) {
        nextButton.disabled = false;
      } else {
        nextButton.disabled = true;
      }

      const container = document.getElementById('planoItensContainer');
      container.innerHTML = '';

      itens.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'plano-item'; 
        div.innerHTML = `<textarea>Item ${index + 1}:${item}</textarea>`;
        container.appendChild(div);
      });

      document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);  

      hideLoading(0);
    }

    async function classifyPattern() {
      showStep(1);
      showLoading(1);

      const container = document.getElementById('planoItensContainer');
      const items = Array.from(container.querySelectorAll('.plano-item'));

        const patternContainer = document.getElementById('patternItensContainer');
        patternContainer.innerHTML = '';

      for (let i = 0; i < items.length; i++) {
        
        const loadingElement = document.getElementById("loading1");
        loadingElement.textContent += ` - Item ${i + 1} (Espera estimada: 15 segundos)`;

        const itemText = items[i].textContent.replace(/^Item \d+:\s*/, '').trim();

        const res = await fetch(`/.netlify/functions/classifyPattern`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hypothesis: itemText }),
        });

        const data = await res.json();

        const resultDiv = document.createElement('div');
        resultDiv.className = 'pattern-result';
        resultDiv.innerHTML = `
          <p>Item ${i + 1}: ${itemText}</p>
          <textarea>${data.pattern}</textarea>
          ${motivoHTML(data.reason)}
        `;

        patternContainer.appendChild(resultDiv);
        loadingElement.textContent = "";
      }

      hideLoading(1);
    }


    async function createCard() {
      try {
        showLoading(1);

        const boardId = getBoardIdFromUrl();
        const originalCardId = getCardIdFromUrl();

        const patternContainer = document.getElementById('patternItensContainer');
        const patternItems = Array.from(patternContainer.querySelectorAll('.pattern-result'));

        for (let i = 0; i < patternItems.length; i++) {
          const itemText = patternItems[i].querySelector('p').textContent;
          const patternText = patternItems[i].querySelector('textarea').value;

          const response = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=TECH PLAN ITEM`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: itemText,
              detalhes: `**Objetivo:** ${state.justificativa}\n**Descrição:** ${state.descricao}\n**Padrão ArchHypo:** ${patternText}\n**Tradeoff:** ${state.tradeoff}`
            })
          });

          const responseData = await response.json();
          const newCardId = responseData.data.id;
          const newCardUrl = responseData.data.shortUrl || responseData.data.url;

          await fetch(`/.netlify/functions/attachment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              responseCardId: newCardId,
              urlDoCard: `https://trello.com/c/${originalCardId}`
            })
          });

          const linkContainer = document.getElementById('cardLink');
          const linkElement = document.createElement('a');
          linkElement.href = newCardUrl;
          linkElement.target = '_blank';
          linkElement.innerText = itemText;
          linkContainer.appendChild(linkElement);
          linkContainer.appendChild(document.createElement('br'));
        }

        showStep(2);
      
      } catch (error) {
        console.error('❌ Erro ao criar o card:', error.message || error);
        alert(`Erro ao criar o card: ${error.message || 'Verifique o console para mais detalhes.'}`);
      }
    finally {
        hideLoading(1);
      }
    }

    function motivoHTML(motivo) {
      return `
        <details>
          <summary><em>Justificativa: (clique aqui)</em></summary>
          <p>${motivo}</p>
        </details>
      `;
    }
