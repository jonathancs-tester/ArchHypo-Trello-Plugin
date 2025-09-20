const state = {
      title: '',
      justificativa: '',
      descricao: '',
      tradeoff: '',
      language: 'pt' // Idioma padrão
    };
    
    let currentStep = 0;
    var cardId = '';

    // Expandir as traduções para incluir mais textos
const translations = {
  pt: {
    placeholders: {
      planContext: "Descreva o contexto técnico ou problema...",
      loading: "⏳ Processando...",
      next: "Próximo",
      previous: "Anterior"
    },
    messages: {
      confirmLeave: "As informações preenchidas serão perdidas. Deseja voltar mesmo assim?",
      selectAtLeastOne: "Por favor, selecione pelo menos um item do plano para editar.",
      createCardError: "Erro ao criar o card:",
      checkConsole: "Verifique o console para mais detalhes.",
      estimatedWait: "(Espera estimada: 15 segundos)",
      justification: "Justificativa: (clique aqui)",
      objective: "**Objetivo:**",
      description: "**Descrição:**",
      pattern: "**Padrão ArchHypo:**",
      tradeoff: "**Tradeoff:**"
    }
  },
  en: {
    placeholders: {
      planContext: "Describe the technical context or problem...",
      loading: "⏳ Processing...",
      next: "Next",
      previous: "Previous"
    },
    messages: {
      confirmLeave: "The filled information will be lost. Do you really want to go back?",
      selectAtLeastOne: "Please select at least one plan item to edit.",
      createCardError: "Error creating card:",
      checkConsole: "Check console for more details.",
      estimatedWait: "(Estimated wait: 15 seconds)",
      justification: "Justification: (click here)",
      objective: "**Objective:**",
      description: "**Description:**",
      pattern: "**ArchHypo Pattern:**",
      tradeoff: "**Tradeoff:**"
    }
  }
};

// Função para atualizar textos
function updateTexts(language) {
  const texts = translations[language];
  
  const planContextTextarea = document.getElementById('planContext');
  if (planContextTextarea) {
    planContextTextarea.placeholder = texts.placeholders.planContext;
  }
  
  document.querySelectorAll('.loading-indicator').forEach(el => {
    el.textContent = texts.placeholders.loading;
  });
  
  document.querySelectorAll('button').forEach(button => {
    const text = button.textContent.trim();
    if (text === 'Próximo' || text === 'Next') {
      button.textContent = texts.placeholders.next;
    }
    if (text === 'Anterior' || text === 'Previous') {
      button.textContent = texts.placeholders.previous;
    }
  });
}

// Função helper para obter texto traduzido
function t(key) {
  const keys = key.split('.');
  let value = translations[state.language];
  for (const k of keys) {
    value = value[k];
  }
  return value || key;
}

function updateLanguage(newLanguage) {
  state.language = newLanguage;
  updateTexts(newLanguage);
  console.log('Language updated to:', newLanguage);
}

document.addEventListener('DOMContentLoaded', () => {
  updateTexts(state.language);
});

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
      const confirmLeave = window.confirm(t('messages.confirmLeave'));
      if (confirmLeave && currentStep >= 0) {
        showStep(currentStep - 1);
      }
    }

    function previousEditStep() {
      const confirmLeave = window.confirm(t('messages.confirmLeave'));
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
        body: JSON.stringify({ 
          input, 
          language: state.language 
        }),
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
      const selectedCheckboxes = document.querySelectorAll('.plano-checkbox:checked');
      if (selectedCheckboxes.length === 0) {
        alert(t('messages.selectAtLeastOne'));
        return;
      }

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
      const selectedCheckboxes = document.querySelectorAll('.plano-checkbox:checked');
      if (selectedCheckboxes.length === 0) {
        alert(t('messages.selectAtLeastOne'));
        return;
      }
      showStep(2);
      showLoading(2);

      const loadingElement = document.getElementById("loading2");
      const textoInicial = loadingElement.textContent;

      const patternContainer = document.getElementById('patternItensContainer');
      patternContainer.innerHTML = ''; // limpa resultados anteriores

      const selectedIndexes = getSelectedItems();
      let itemTexts = [];

      for (let i = 0; i < selectedIndexes.length; i++) {
        const idx = selectedIndexes[i];

        // Tenta encontrar o textarea correspondente
        const textarea = document.querySelector(`.edit-plan textarea[data-index="${idx}"]`);
        let itemText = '';

        if (textarea && textarea.value.trim()) {
          itemText = textarea.value.trim(); // Prioriza texto editado
        } else {
          const label = document.querySelector(`.plano-checkbox[data-index="${idx}"] + label`);
          if (label) {
            itemText = label.textContent.trim(); // Usa texto original se não houver edição
          }
        }

        if (itemText) {
          itemTexts.push(itemText);
        }
      }

      // Processa cada item
      for (let i = 0; i < itemTexts.length; i++) {
        const itemText = itemTexts[i];
        loadingElement.textContent = `${textoInicial} ${t('messages.estimatedWait')}`;

        try {
          const res = await fetch(`/.netlify/functions/classifyPattern`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              hypothesis: itemText, 
              language: state.language 
            }),
          });

          const data = await res.json();

          const resultDiv = document.createElement('div');
          const fixedOptions = [
                "Architectural Spike",
                "Architectural Trigger",
                "Bring the Specialist",
                "Continuous Inspection",
                "Learning from Experiments",
                "Plan for Preparation",
                "Postpone Uncertain Decisions",
                "Protective Guideline",
                "Quality Checkpoint",
                "Software Analytics",
                "Technical Debt Management",
                "Tracer Bullets"
            // "Architectural Hypotheses", "Architectural Spike", "Architectural Trigger",
            //         "Architecture in the Backlog", "Bring the Specialist", "Choose the Means",
            //         "Climbing on the Shoulders of Giants", "Continuous Inspection",
            //         "Define Quality Standards", "Find Where it Hurts", "Hypothesis Impact",
            //         "Learning from Experiments", "Plan Analytics Implementation",
            //         "Plan for Preparation", "Plan for Responsible Moments",
            //         "Postpone Uncertain Decisions", "Protective Guideline",
            //         "Quality Checkpoint", "Reachable Goals", "Small Steps for Analytics",
            //         "Suspend Measurement", "Technical Debt Management",
            //         "Test Architecture", "Tracer Bullets", "Uncertainty Level",
            //         "What you Need to Know"
                  ];
          resultDiv.className = 'pattern-result';
          resultDiv.innerHTML = `
            <div class="pattern-header">
              <span class="hover-info">
                ℹ️
                <div class="hover-box">
                  <strong>Métricas:</strong><br>
                  <b>Precision@5:</b> ${data.evaluation?.precisionAt5?.toFixed(2)}<br>
                  <b>Hit Rate:</b> ${data.evaluation?.hitRate?.toFixed(2)}<br>
                  <b>MRR:</b> ${data.evaluation?.mrr?.toFixed(2)}<br>
                  <b>Consistência Factual:</b> ${data.evaluation?.factualConsistencyScore?.toFixed(5)}<br>
                  <b>Relevância da Resposta:</b> ${data.evaluation?.relevanceScore?.toFixed(5)}
                </div>
              </span>
              <p>${itemText}</p>
            </div>
            <div class="pattern-hover-container">
              <select id="patternSelect">
                ${fixedOptions.map(option => `
                  <option value="${option}" ${option === data.pattern ? 'selected' : ''}>${option}</option>
                `).join('')}
              </select>
            </div>
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
          const patternText = patternItems[i].querySelector('select').value;

          const response = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=ITEM PLANO TECNICO`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: itemText,
              detalhes: `${t('messages.objective')} ${state.justificativa}\n${t('messages.description')} ${state.descricao}\n${t('messages.pattern')} ${patternText}\n${t('messages.tradeoff')} ${state.tradeoff}`
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
        alert(`${t('messages.createCardError')} ${error.message || t('messages.checkConsole')}`);
      } finally {
        hideLoading(2);
      }
    }

    function motivoHTML(motivo) {
      return `
        <details>
          <summary><em>${t('messages.justification')}</em></summary>
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
