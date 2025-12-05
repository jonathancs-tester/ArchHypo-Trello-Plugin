const state = {
  title: '',
  justificativa: '',
  descricao: '',
  tradeoff: '',
  language: 'pt'
};

function previousEditStep() {
  const confirmLeave = window.confirm(I18N.t('confirmLeave'));
  if (confirmLeave && currentStep >= 0) {
    showStep(currentStep - 1);
  }
}

let currentStep = 0;
var cardId = '';

// Initialize language from URL parameter or I18N system
function initializeLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');

  if (urlLang && I18N.translations[urlLang]) {
    I18N.setLanguage(urlLang);
    state.language = urlLang;
  } else {
    state.language = I18N.getCurrentLanguage();
  }

  // Set language selector
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = state.language;
  }

  updateTexts(state.language);
}

// Função para atualizar textos usando I18N
function updateTexts(language) {
  I18N.setLanguage(language);

  // Update page title
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = I18N.t('technicalPlanPageTitle');
  }

  // Update step titles
  const step0Title = document.getElementById('step0Title');
  if (step0Title) step0Title.textContent = I18N.t('techPlanStep0Title');

  const step1Title = document.getElementById('step1Title');
  if (step1Title) step1Title.textContent = I18N.t('techPlanStep1Title');

  const step2Title = document.getElementById('step2Title');
  if (step2Title) step2Title.textContent = I18N.t('techPlanStep2Title');

  const step3Title = document.getElementById('step3Title');
  if (step3Title) step3Title.textContent = I18N.t('techPlanStep3Title');

  // Update buttons
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) generateBtn.textContent = I18N.t('generate');

  const editBtn = document.getElementById('editBtn');
  if (editBtn) editBtn.textContent = I18N.t('edit');

  const step0NextBtn = document.getElementById('step0NextBtn');
  if (step0NextBtn) step0NextBtn.textContent = I18N.t('next');

  const step1PrevBtn = document.getElementById('step1PrevBtn');
  if (step1PrevBtn) step1PrevBtn.textContent = I18N.t('previous');

  const step1NextBtn = document.getElementById('step1NextBtn');
  if (step1NextBtn) step1NextBtn.textContent = I18N.t('next');

  const step2PrevBtn = document.getElementById('step2PrevBtn');
  if (step2PrevBtn) step2PrevBtn.textContent = I18N.t('previous');

  const step2CreateBtn = document.getElementById('step2CreateBtn');
  if (step2CreateBtn) step2CreateBtn.textContent = I18N.t('create');

  // Update loading indicators
  const loadingElements = ['loading0', 'loading1', 'loading2'];
  loadingElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = I18N.t('loading');
  });
}

// Função helper para obter texto traduzido (usar I18N)
function t(key) {
  return I18N.t(key);
}

function updateLanguage(newLanguage) {
  state.language = newLanguage;
  I18N.setLanguage(newLanguage);
  updateTexts(newLanguage);

  // Update language selector
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = newLanguage;
  }

  console.log('Language updated to:', newLanguage);
}

document.addEventListener('DOMContentLoaded', () => {
  initializeLanguage();
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
  const confirmLeave = window.confirm(I18N.t('confirmLeave'));
  if (confirmLeave && currentStep >= 0) {
    showStep(currentStep - 1);
  }
}

function previousEditStep() {
  const confirmLeave = window.confirm(I18N.t('confirmLeave'));
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

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

async function analyzePlan() {
  try {
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

  } catch (error) {
    console.error('❌ Erro ao analisar plano:', error.message || error);
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);

    // Limpar interface em caso de erro
    const container = document.getElementById('planoItensContainer');
    container.innerHTML = `<p style="color: red;">${I18N.t('errorGeneratingTechnicalPlan')}</p>`;

    const nextButton = document.querySelector('button[onclick="classifyPattern()"]');
    nextButton.disabled = true;
  } finally {
    hideLoading(0);
  }
}

async function editPlan() {
  const selectedCheckboxes = document.querySelectorAll('.plano-checkbox:checked');
  if (selectedCheckboxes.length === 0) {
    alert(I18N.t('selectAtLeastOne'));
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
    alert(I18N.t('selectAtLeastOne'));
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
    const hypothesisText = itemText.split(":")[1]?.trim() || "";
    loadingElement.textContent = `${textoInicial} ${I18N.t('estimatedWait')}`;

    try {
      const res = await fetch(`/.netlify/functions/classifyPattern`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesis: hypothesisText,
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
                  <strong>${I18N.t('metricsTitle')}</strong><br>
                  <b>${I18N.t('precisionAt5')}:</b> ${data.evaluation?.precisionAt5?.toFixed(2)}<br>
                  <b>${I18N.t('hitRate')}:</b> ${data.evaluation?.hitRate?.toFixed(2)}<br>
                  <b>${I18N.t('mrr')}:</b> ${data.evaluation?.mrr?.toFixed(2)}<br>
                  <b>${I18N.t('factualConsistency')}:</b> ${data.evaluation?.factualConsistencyScore?.toFixed(5)}<br>
                  <b>${I18N.t('relevanceScore')}:</b> ${data.evaluation?.relevanceScore?.toFixed(5)}
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

      const response = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=${I18N.t('col2')}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemText,
          detalhes: `${I18N.t('objective')} ${state.justificativa}\n\n${I18N.t('description')} ${state.descricao}\n\n${I18N.t('pattern')} ${patternText}\n\n${I18N.t('tradeoff')} ${state.tradeoff}`
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
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);
  } finally {
    hideLoading(2);
  }
}

function motivoHTML(motivo) {
  return `
        <details>
          <summary><em>${I18N.t('justification')}</em></summary>
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
