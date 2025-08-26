   const state = {
      title: '',
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

    function previousEditStep() {
      const confirmLeave = window.confirm("As informações preenchidas serão perdidas. Deseja voltar mesmo assim?");
      if (confirmLeave && currentStep >= 0) {
        showStep(currentStep - 2);
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
      const match = input.title?.match(/^(H\d+)\s*:/i);
      const clean = str => str.replace(/[*]+/g, '').trim();
      state.title = match ? clean(match[1]) : null;

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
      else 
        itens = sugestao.split("'");

      itens = itens.map(item => item.trim()).filter(item => item !== '');

      const nextButton = document.querySelector('button[onclick="classifyPattern()"]');
      nextButton.disabled = itens.length === 0;

      const container = document.getElementById('planoItensContainer');
      container.innerHTML = '';

      itens.forEach((item, index) => {
        const id = `item-${index}`;
        const div = document.createElement('div');
        div.className = 'plano-item';
        div.style.marginBottom = '0.5rem';

        div.innerHTML = `
          <input type="checkbox" id="${id}" class="plano-checkbox" data-index="${index}" checked />
          <label for="${id}">${state.title} - TPI ${index + 1}: ${item}</label>
        `;

        container.appendChild(div);
      });

      document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);  

      hideLoading(0);
    }

    async function editPlan() {
      showStep(1);
      showLoading(1);

      const editContainer = document.getElementById('editItensContainer');
      const loadingElement = document.getElementById("loading1");
      const textoInicial = loadingElement.textContent;

      const selectedIndexes = getSelectedItems();
      editContainer.innerHTML = ''; // limpa resultados anteriores

      for (let i = 0; i < selectedIndexes.length; i++) {
        const idx = selectedIndexes[i];

        // Pega o label correspondente ao checkbox
        const label = document.querySelector(`.plano-checkbox[data-index="${idx}"] + label`);
        if (!label) continue;

        const itemText = label.textContent.trim();

        const resultDiv = document.createElement('div');
        resultDiv.className = 'edit-plan';
        resultDiv.innerHTML = `
          <textarea data-index="${idx}">${itemText}</textarea>
        `;

        editContainer.appendChild(resultDiv);
      }

      loadingElement.textContent = textoInicial;
      hideLoading(1);
    }

    async function classifyPattern() {
      showStep(2);
      showLoading(2);

      const loadingElement = document.getElementById("loading2");
      const textoInicial = loadingElement.textContent;

      const patternContainer = document.getElementById('patternItensContainer');
      patternContainer.innerHTML = ''; // limpa resultados anteriores

      let itemTexts = [];

      // Verifica se há checkboxes selecionados
      const selectedCheckboxes = document.querySelectorAll('.plano-checkbox:checked');
      if (selectedCheckboxes.length > 0) {
        const selectedIndexes = getSelectedItems();

        for (let i = 0; i < selectedIndexes.length; i++) {
          const idx = selectedIndexes[i];
          const label = document.querySelector(`.plano-checkbox[data-index="${idx}"] + label`);
          if (label) {
            itemTexts.push(label.textContent.trim());
          }
        }
      } else {
        const editItensContainer = document.getElementById('editItensContainer');
        const editItems = Array.from(editItensContainer.querySelectorAll('.edit-plan'));

        for (let i = 0; i < editItems.length; i++) {
          const textarea = editItems[i].querySelector('textarea');
          if (textarea) {
            itemTexts.push(textarea.value.trim());
          }
        }
      }

      // Processa cada item
      for (let i = 0; i < itemTexts.length; i++) {
        const itemText = itemTexts[i];
        loadingElement.textContent = `${textoInicial} - TPI ${i + 1} (Espera estimada: 15 segundos)`;

        try {
          const res = await fetch(`/.netlify/functions/classifyPattern`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hypothesis: itemText }),
          });

          const data = await res.json();

          const resultDiv = document.createElement('div');
          resultDiv.className = 'pattern-result';
          resultDiv.innerHTML = `
            <p>${itemText}</p>
            <textarea>${data.pattern}</textarea>
            ${motivoHTML(data.reason)}
          `;

          patternContainer.appendChild(resultDiv);
        } catch (error) {
          console.error('Erro ao classificar o item:', error);
        }
      }

      loadingElement.textContent = textoInicial;
      hideLoading(2);
    }

    async function createCard() {
      try {
        showLoading(2);

        const boardId = getBoardIdFromUrl();
        const originalCardId = getCardIdFromUrl();

        const patternContainer = document.getElementById('patternItensContainer');
        const patternItems = Array.from(patternContainer.querySelectorAll('.pattern-result'));

        for (let i = 0; i < patternItems.length; i++) {
          const itemText = patternItems[i].querySelector('p').textContent;
          const patternText = patternItems[i].querySelector('textarea').value;

          const response = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=ITEM PLANO TECNICO`, {
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

        showStep(3);
      
      } catch (error) {
        console.error('❌ Erro ao criar o card:', error.message || error);
        alert(`Erro ao criar o card: ${error.message || 'Verifique o console para mais detalhes.'}`);
      }
    finally {
        hideLoading(2);
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

    // Função para pegar somente os itens selecionados antes de enviar para o próximo passo
    function getSelectedItems() {
      const selected = [...document.querySelectorAll('.plano-checkbox')]
        .filter(chk => chk.checked)
        .map(chk => {
          const idx = Number(chk.dataset.index);
          return idx;
        });
      return selected;
    }
