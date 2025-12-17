const state = {
  contexto: '',
  incertezaTotal: 0,
  incerteza: '',
  incertezaMotivo: '',
  impacto: '',
  impactoMotivo: '',
  hipotese: '',
  hipoteseMotivo: '',
  dominio: '',
  dominioMotivo: '',
  language: 'pt' // Idioma padrão
};

let currentStep = 0;
let sugestaoOriginal = '';
let allData = '';

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
    pageTitle.textContent = I18N.t('createHypothesesPageTitle');
  }

  // Update step titles if elements exist
  const step0Title = document.getElementById('step0Title');
  if (step0Title) step0Title.textContent = I18N.t('uncertaintyStepTitle');

  const step1Title = document.getElementById('step1Title');
  if (step1Title) step1Title.textContent = I18N.t('hypothesisStepTitle');

  const step2Title = document.getElementById('step2Title');
  if (step2Title) step2Title.textContent = I18N.t('nfrStepTitle');

  const step3Title = document.getElementById('step3Title');
  if (step3Title) step3Title.innerHTML = `
    ${I18N.t('uncertaintyAssessmentTitle')}
    <span class="help-icon" tabindex="0" aria-label="Help">❔<span class="tooltip" id="uncertaintyTooltip"></span></span>
  `;

  const step4Title = document.getElementById('step4Title');
  if (step4Title) step4Title.innerHTML = `
    ${I18N.t('impactAssessmentTitle')}
    <span class="help-icon" tabindex="0" aria-label="Help">❔<span class="tooltip" id="impactTooltip"></span></span>
  `;

  const step5Title = document.getElementById('step5Title');
  if (step5Title) step5Title.textContent = I18N.t('cardCreatedTitle');

  // Update buttons
  const step0NextBtn = document.getElementById('step0NextBtn');
  if (step0NextBtn) step0NextBtn.textContent = I18N.t('next');

  const step1PrevBtn = document.getElementById('step1PrevBtn');
  if (step1PrevBtn) step1PrevBtn.textContent = I18N.t('previous');

  const step1NextBtn = document.getElementById('step1NextBtn');
  if (step1NextBtn) step1NextBtn.textContent = I18N.t('next');

  const step2PrevBtn = document.getElementById('step2PrevBtn');
  if (step2PrevBtn) step2PrevBtn.textContent = I18N.t('previous');

  const step2NextBtn = document.getElementById('step2NextBtn');
  if (step2NextBtn) step2NextBtn.textContent = I18N.t('next');

  const step3PrevBtn = document.getElementById('step3PrevBtn');
  if (step3PrevBtn) step3PrevBtn.textContent = I18N.t('previous');

  const step3NextBtn = document.getElementById('step3NextBtn');
  if (step3NextBtn) step3NextBtn.textContent = I18N.t('next');

  const step4PrevBtn = document.getElementById('step4PrevBtn');
  if (step4PrevBtn) step4PrevBtn.textContent = I18N.t('previous');

  const step4CreateBtn = document.getElementById('step4CreateBtn');
  if (step4CreateBtn) step4CreateBtn.textContent = I18N.t('create');

  const useHistoryBtn = document.getElementById('useHistoryBtn');
  if (useHistoryBtn) useHistoryBtn.textContent = I18N.t('useHistorical');

  const skipHistoryBtn = document.getElementById('skipHistoryBtn');
  if (skipHistoryBtn) skipHistoryBtn.textContent = I18N.t('ignoreHistorical');

  // Update placeholders
  const contextoTextarea = document.getElementById('contexto');
  if (contextoTextarea) {
    contextoTextarea.placeholder = I18N.t('contextPlaceholder');
  }

  // Update loading indicators
  const loadingElements = ['loading0', 'loading1', 'loading2', 'loading3', 'loading4'];
  loadingElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.textContent = I18N.t('loading');
  });

  // Update NFR options
  const nfrFlexibility = document.getElementById('nfrFlexibility');
  if (nfrFlexibility) nfrFlexibility.textContent = I18N.t('flexibilityText');

  const nfrPerformance = document.getElementById('nfrPerformance');
  if (nfrPerformance) nfrPerformance.textContent = I18N.t('performanceText');

  const nfrProductivity = document.getElementById('nfrProductivity');
  if (nfrProductivity) nfrProductivity.textContent = I18N.t('productivityText');

  const nfrReliability = document.getElementById('nfrReliability');
  if (nfrReliability) nfrReliability.textContent = I18N.t('reliabilityText');

  const nfrSecurity = document.getElementById('nfrSecurity');
  if (nfrSecurity) nfrSecurity.textContent = I18N.t('securityText');

  const nfrUsability = document.getElementById('nfrUsability');
  if (nfrUsability) nfrUsability.textContent = I18N.t('usabilityText');

  // Update level options
  const levelVeryLow1 = document.getElementById('levelVeryLow1');
  if (levelVeryLow1) levelVeryLow1.textContent = I18N.t('veryLowText');

  const levelLow1 = document.getElementById('levelLow1');
  if (levelLow1) levelLow1.textContent = I18N.t('lowText');

  const levelMedium1 = document.getElementById('levelMedium1');
  if (levelMedium1) levelMedium1.textContent = I18N.t('mediumText');

  const levelHigh1 = document.getElementById('levelHigh1');
  if (levelHigh1) levelHigh1.textContent = I18N.t('highText');

  const levelVeryHigh1 = document.getElementById('levelVeryHigh1');
  if (levelVeryHigh1) levelVeryHigh1.textContent = I18N.t('veryHighText');

  const levelVeryLow2 = document.getElementById('levelVeryLow2');
  if (levelVeryLow2) levelVeryLow2.textContent = I18N.t('veryLowText');

  const levelLow2 = document.getElementById('levelLow2');
  if (levelLow2) levelLow2.textContent = I18N.t('lowText');

  const levelMedium2 = document.getElementById('levelMedium2');
  if (levelMedium2) levelMedium2.textContent = I18N.t('mediumText');

  const levelHigh2 = document.getElementById('levelHigh2');
  if (levelHigh2) levelHigh2.textContent = I18N.t('highText');

  const levelVeryHigh2 = document.getElementById('levelVeryHigh2');
  if (levelVeryHigh2) levelVeryHigh2.textContent = I18N.t('veryHighText');

  // Update tooltips
  const uncertaintyTooltip = document.getElementById('uncertaintyTooltip');
  if (uncertaintyTooltip) {
    uncertaintyTooltip.innerHTML = 
      I18N.t('uncertaintyTooltipVeryLow') + '<br>' +
      I18N.t('uncertaintyTooltipLow') + '<br>' +
      I18N.t('uncertaintyTooltipMedium') + '<br>' +
      I18N.t('uncertaintyTooltipHigh') + '<br>' +
      I18N.t('uncertaintyTooltipVeryHigh');
  }

  const impactTooltip = document.getElementById('impactTooltip');
  if (impactTooltip) {
    impactTooltip.innerHTML = 
      I18N.t('impactTooltipVeryLow') + '<br>' +
      I18N.t('impactTooltipLow') + '<br>' +
      I18N.t('impactTooltipMedium') + '<br>' +
      I18N.t('impactTooltipHigh') + '<br>' +
      I18N.t('impactTooltipVeryHigh');
  }
  
  // Update language selector options
  const ptOption = document.getElementById('ptOption');
  if (ptOption) ptOption.textContent = I18N.t('portugueseLabel');
  
  const enOption = document.getElementById('enOption');
  if (enOption) enOption.textContent = I18N.t('englishLabel');
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

// Inicializar textos no carregamento
document.addEventListener('DOMContentLoaded', () => {
  initializeLanguage();
});

function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('boardId');
}

async function getCardCount() {
  const boardId = getBoardIdFromUrl();
    const query = `boardId=${boardId}&column=${I18N.t('col1')}`;

    const res = await fetch(`/.netlify/functions/get-uncertainty?` + query, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
    }

    allData = await res.json();

    fetch("/.netlify/functions/log", {
      method: "POST",
      body: "O usuário fez requisicao para API get-uncertainty."
    });

    return allData;
}

function showStep(stepId) {
  fetch("/.netlify/functions/log", {
    method: "POST",
    body: "O usuário clicou no botão NEXT"
  });
  currentStep = stepId;
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  const stepElement = document.getElementById('step' + stepId);
  if (stepElement) {
    stepElement.classList.add('active');
  }
}

function previousStep() {
  fetch("/.netlify/functions/log", {
    method: "POST",
    body: "O usuário clicou no botão PREVIOUS"
  });
  const confirmLeave = window.confirm(I18N.t('confirmLeave'));
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
    body: JSON.stringify({
      input,
      language: state.language
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  fetch("/.netlify/functions/log", {
    method: "POST",
    body: JSON.stringify({
      message: "O usuário enviou uma requisição ao endpoint",
      endpoint: endpoint,
      input: input,
      language: state.language,
      result: data
    })
  });
  return data;
}

async function analyzeHypothesis() {
  try {
    allData = await getCardCount();
    state.incertezaTotal = allData?.length || 0;
    showLoading(0);
    const input = document.getElementById('contexto').value;
    const { sugestao, motivo } = await callEndpoint('analyze-hypothesis', input);
    state.contexto = input;

    sugestaoOriginal = sugestao;
    const hipoteseField = document.getElementById('hipotese');
    const motivoField = document.getElementById('hipoteseMotivo');

    hipoteseField.value = sugestao;
    document.getElementById('hipoteseResultado').innerHTML = motivoHTML(motivo);
    hipoteseField.style.display = 'block';
    motivoField.style.display = 'none';
    updatePreviewPanel();

    hipoteseField.addEventListener('input', function () {
      const sugestaoAtual = this.value;
      if (sugestaoAtual !== sugestaoOriginal) {
        motivoField.style.display = 'block';
        motivoField.placeholder = I18N.t('justifyChangePlaceholder');
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    motivoField.addEventListener('blur', function () {
      fetch("/.netlify/functions/log", {
        method: "POST",
        body: "O usuário modificou a justificativa. Atual: " + hipoteseField.value + ' Original: ' + sugestao + ' Justificativa: ' + this.value
      });
    });

    showStep(1);
  } catch (error) {
    console.error('❌ Erro ao analisar hipótese:', error.message || error);
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);
  } finally {
    hideLoading(0);
  }
}

async function analyzeDomain() {
  try {
    showLoading(1);
    state.hipotese = document.getElementById('hipotese').value;
    state.hipoteseMotivo = document.getElementById('hipoteseResultado').value;

    const input = `
      ${I18N.t('context')}: ${state.contexto};
      ${I18N.t('hypothesesHistorical')}: ${state.hipotese};
    `;
    const { sugestao, motivo } = await callEndpoint('analyze-domain', input);


    sugestaoOriginal = sugestao;
    const dominioField = document.getElementById('dominio');
    const motivoField = document.getElementById('dominioMotivo');


    // Se for select, tente setar pelo value ou pelo texto, adicionando a opção se necessário
    if (dominioField && dominioField.tagName === 'SELECT') {
      let found = false;
      for (let option of dominioField.options) {
        if (option.value === sugestao || option.text === sugestao) {
          dominioField.value = option.value;
          found = true;
          break;
        }
      }
      if (!found) {
        // Adiciona a opção dinamicamente
        const opt = document.createElement('option');
        opt.value = sugestao;
        opt.text = sugestao;
        dominioField.appendChild(opt);
        dominioField.value = sugestao;
      }
      updatePreviewPanel();
    } else if (dominioField) {
      dominioField.value = sugestao;
    }

    document.getElementById('dominioResultado').innerHTML = motivoHTML(motivo);
    dominioField.style.display = 'block';
    motivoField.style.display = 'none';
    updatePreviewPanel();

    dominioField.addEventListener('input', function () {
      const sugestaoAtual = this.value;
      if (sugestaoAtual !== sugestaoOriginal) {
        motivoField.style.display = 'block';
        motivoField.placeholder = I18N.t('justifyChangePlaceholder');
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    motivoField.addEventListener('blur', function () {
      fetch("/.netlify/functions/log", {
        method: "POST",
        body: "O usuário modificou a justificativa. Atual: " + dominioField.value + ' Original: ' + sugestao + ' Justificativa: ' + this.value
      });
    });

    showStep(2);
  } catch (error) {
    console.error('❌ Erro ao analisar domínio:', error.message || error);
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);
  } finally {
    hideLoading(1);
  }
}

async function analyzeUncertainty() {
  try {
    showLoading(2);
    state.dominio = document.getElementById('dominio').value;
    state.dominioMotivo = document.getElementById('dominioResultado').value;

    let uncertaintyHistoricalStr = '';
    let usarHistorico = false;

    if (state.incertezaTotal !== 0) {
      const data = allData.slice(0, 10);

      uncertaintyHistoricalStr = Array.isArray(data)
        ? data.map(item => {
            const { totalCards, ...rest } = item;
            return JSON.stringify(rest);
          }).join('; ')
        : '';

      usarHistorico = await showUncertaintyModal(data);
    }

    const input = `
      ${I18N.t('context')}: ${state.contexto};
      ${I18N.t('hypothesesHistorical')}: ${state.hipotese};
      ${I18N.t('nfrChart')}: ${state.dominio};
      ${I18N.t('uncertaintyChart')}: ${state.incerteza};
      ${usarHistorico ? `${I18N.t('uncertaintyHistorical')}: ${uncertaintyHistoricalStr};` : ''}
    `;

    const { sugestao, motivo } = await callEndpoint('analyze-uncertainty', input);

    sugestaoOriginal = sugestao;
    const incertezaField = document.getElementById('incerteza');
    const motivoField = document.getElementById('incertezaMotivo');

    incertezaField.value = sugestao;
    document.getElementById('incertezaResultado').innerHTML = motivoHTML(motivo);
    incertezaField.style.display = 'block';
    motivoField.style.display = 'none';
    updatePreviewPanel();

    incertezaField.addEventListener('input', function () {
      const sugestaoAtual = this.value;
      if (sugestaoAtual !== sugestaoOriginal) {
        motivoField.style.display = 'block';
        motivoField.placeholder = I18N.t('justifyChangePlaceholder');
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    motivoField.addEventListener('blur', function () {
      fetch("/.netlify/functions/log", {
        method: "POST",
        body: "O usuário modificou a justificativa. Atual: " + incertezaField.value + ' Original: ' + sugestao + ' Justificativa: ' + this.value
      });
    });

    showStep(3);
  } catch (error) {
    console.error('❌ Erro ao analisar incerteza:', error.message || error);
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);
  } finally {
    hideLoading(2);
  }
}

async function analyzeImpact() {
  try {
    showLoading(3);
    state.incerteza = document.getElementById('incerteza').value;
    state.incertezaMotivo = document.getElementById('incertezaResultado').value;

    const boardId = getBoardIdFromUrl();
    const query = `boardId=${boardId}&column=${I18N.t('col1')}`;

    const res = await fetch(`/.netlify/functions/get-impact?` + query, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}: ${res.statusText}`);
    }

    const allData = await res.json();

    fetch("/.netlify/functions/log", {
      method: "POST",
      body: "O usuário fez requisicao para API get-impact."
    });

    state.impactoTotal = allData?.length || 0;

    let impactHistoricalStr = '';
    let usarHistorico = false;

    if (state.impactoTotal !== 0) {
      const data = allData.slice(0, 10);

      impactHistoricalStr = Array.isArray(data)
        ? data.map(item => {
            const { totalCards, ...rest } = item;
            return JSON.stringify(rest);
          }).join('; ')
        : '';

      usarHistorico = await showImpactModal(data);
    }

    const input = `
      ${I18N.t('context')}: ${state.contexto};
      ${I18N.t('hypothesesHistorical')}: ${state.hipotese};
      ${I18N.t('nfrChart')}: ${state.dominio};
      ${I18N.t('uncertaintyChart')}: ${state.incerteza};
      ${usarHistorico ? `${I18N.t('impactHistorical')}: ${impactHistoricalStr};` : ''}
    `;

    const { sugestao, motivo } = await callEndpoint('analyze-impact', input);

    sugestaoOriginal = sugestao;
    const impactoField = document.getElementById('impacto');
    const motivoField = document.getElementById('impactoMotivo');

    impactoField.value = sugestao;
    document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);
    impactoField.style.display = 'block';
    motivoField.style.display = 'none';
    updatePreviewPanel();

    impactoField.addEventListener('input', function () {
      const sugestaoAtual = this.value;
      if (sugestaoAtual !== sugestaoOriginal) {
        motivoField.style.display = 'block';
        motivoField.placeholder = I18N.t('justifyChangePlaceholder');
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    motivoField.addEventListener('blur', function () {
      fetch("/.netlify/functions/log", {
        method: "POST",
        body: "O usuário modificou a justificativa. Atual: " + impactoField.value + ' Original: ' + sugestao + ' Justificativa: ' + this.value
      });
    });

    showStep(4);
  } catch (error) {
    console.error('❌ Erro ao analisar impacto:', error.message || error);
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);
  } finally {
    hideLoading(3);
  }
}

async function createCard() {
  try {
    showLoading(4);
    state.dominio = document.getElementById('dominio').value;
    state.impacto = document.getElementById('impacto').value;
    state.impactoMotivo = document.getElementById('impactoMotivo').value;
    // Traduza os valores do state para o idioma selecionado, se necessário
    const levelMap = I18N.getLevelMapping();
    const nfrMap = I18N.getNFRMapping ? I18N.getNFRMapping() : {};
    // Se não houver mapeamento, mantém o valor original
    const dominioText = nfrMap[state.dominio] || state.dominio;
    const incertezaText = levelMap[state.incerteza] || state.incerteza;
    const impactoText = levelMap[state.impacto] || state.impacto;

    state.impactoMotivo = document.getElementById('impactoResultado').value;

    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');
    
    // Remove o espaço extra dos labels e adiciona ** corretamente
    const nfrLabel = I18N.t('nfrLevelLabel').trim();
    const uncertaintyLabel = I18N.t('uncertainty').trim();
    const uncertaintyLevelLabel = I18N.t('uncertaintyLevelLabel').trim();
    const impactLevelLabel = I18N.t('impactLevelLabel').trim();
    
    const data = {
      name: "H" + (state.incertezaTotal + 1) + ": " + state.hipotese,
      detalhes:
        "**" + nfrLabel + "** " + dominioText + "\n" +
        "**" + uncertaintyLabel + "** " + state.contexto + "\n" +
        "**" + uncertaintyLevelLabel + "** " + incertezaText + "\n" +
        "**" + impactLevelLabel + "** " + impactoText
    };

    const res = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=${I18N.t('col1')}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    fetch("/.netlify/functions/log", {
      method: "POST",
      body: JSON.stringify({
        message: "O usuário enviou uma requisição ao endpoint",
        endpoint: `create-card?boardId=${boardId}&column=${I18N.t('col1')}`,
        input: data,
        language: state.language,
        result: result
      })
    });

    if (!res.ok) {
      alert(`${I18N.t('createCardError')} ${result.error || result.erro || I18N.t('unknownError')}`);
      return;
    }

    const cardUrl = result.data.shortUrl || result.data.url;

    document.getElementById('cardLink').innerHTML = `<a href="${cardUrl}" target="_blank">${data.name}</a>`;
    showStep(5);
  } catch (error) {
    console.error('❌ Erro ao criar o card:', error.message || error);
    alert(`${I18N.t('createCardError')} ${error.message || I18N.t('checkConsole')}`);
  } finally {
    hideLoading(3);
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

function showUncertaintyModal(data) {
  const historicalTitle = document.getElementById('historicalTitle');
  if (historicalTitle) historicalTitle.textContent = I18N.t('uncertaintyTitle');

  return new Promise(resolve => {
    const modal = document.getElementById('uncertaintyModal');
    const listContainer = document.getElementById('uncertaintyList');
    const useBtn = document.getElementById('useHistoryBtn');
    const skipBtn = document.getElementById('skipHistoryBtn');

    // Limpa conteúdo anterior
    listContainer.innerHTML = '';

    // Cria a tabela
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>${I18N.t('hypothesesHistorical')}</th>
          <th>${I18N.t('uncertaintyHistorical')}</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(item => {
      const row = document.createElement('tr');

      const hipoteseCell = document.createElement('td');
      hipoteseCell.textContent = item.hipotese;

      const incertezaCell = document.createElement('td');
      incertezaCell.textContent = item.incerteza;

      row.appendChild(hipoteseCell);
      row.appendChild(incertezaCell);
      tbody.appendChild(row);
    });

    listContainer.appendChild(table);
    
    useBtn.disabled = false;
    skipBtn.disabled = false;
    modal.style.display = 'block';

    useBtn.onclick = () => {
      modal.style.display = 'none';
      resolve(true);
    };

    skipBtn.onclick = () => {
      modal.style.display = 'none';
      resolve(false);
    };
  });
}

function showImpactModal(data) {
  const historicalTitle = document.getElementById('historicalTitle');
  if (historicalTitle) historicalTitle.textContent = I18N.t('impactTitle');

  return new Promise(resolve => {
    const modal = document.getElementById('uncertaintyModal');
    const listContainer = document.getElementById('uncertaintyList');
    const useBtn = document.getElementById('useHistoryBtn');
    const skipBtn = document.getElementById('skipHistoryBtn');

    // Limpa conteúdo anterior
    listContainer.innerHTML = '';

    // Cria a tabela
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>${I18N.t('hypothesesHistorical')}</th>
          <th>${I18N.t('impactHistorical')}</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(item => {
      const row = document.createElement('tr');

      const hipoteseCell = document.createElement('td');
      hipoteseCell.textContent = item.hipotese;

      const incertezaCell = document.createElement('td');
      incertezaCell.textContent = item.impacto;

      row.appendChild(hipoteseCell);
      row.appendChild(incertezaCell);
      tbody.appendChild(row);
    });

    listContainer.appendChild(table);
    
    useBtn.disabled = false;
    skipBtn.disabled = false;
    modal.style.display = 'block';

    useBtn.onclick = () => {
      modal.style.display = 'none';
      resolve(true);
    };

    skipBtn.onclick = () => {
      modal.style.display = 'none';
      resolve(false);
    };
  });
}

// Atualiza o painel de preview dinâmico
function updatePreviewPanel() {
  const preview = document.getElementById('preview-content');
  if (!preview) return;
  const hipotese = document.getElementById('hipotese')?.value || '';
  const dominio = document.getElementById('dominio')?.value || '';
  const contexto = document.getElementById('contexto')?.value || '';
  const incerteza = document.getElementById('incerteza')?.value || '';
  const impacto = document.getElementById('impacto')?.value || '';
  const levelMap = I18N.getLevelMapping();
  const nfrMap = I18N.getNFRMapping ? I18N.getNFRMapping() : {};
  const dominioText = nfrMap[dominio] || dominio;
  const incertezaText = levelMap[incerteza] || incerteza;
  const impactoText = levelMap[impacto] || impacto;

  // Verifica se há algum conteúdo
  if (!hipotese && !contexto && !dominio && !incerteza && !impacto) {
    preview.innerHTML = `
      <h2>${I18N.t('previewTitle')}</h2>
      <div class="empty-state">${I18N.t('fillFieldsToPreview') || 'Preencha os campos para visualizar o preview'}</div>
    `;
    return;
  }

  // Monta o card com estilo Trello
  let badgesHTML = '';
  if (incerteza) {
    // Remove espaços e converte para lowercase para a classe CSS
    const incertezaClass = incerteza.toLowerCase().replace(/\s+/g, '');
    badgesHTML += `<span class="badge uncertainty ${incertezaClass}">${I18N.t('uncertaintyBadge')}: ${incertezaText}</span>`;
  }
  if (impacto) {
    // Remove espaços e converte para lowercase para a classe CSS
    const impactoClass = impacto.toLowerCase().replace(/\s+/g, '');
    badgesHTML += `<span class="badge impact ${impactoClass}">${I18N.t('impactBadge')}: ${impactoText}</span>`;
  }
  if (dominio) {
    badgesHTML += `<span class="badge nfr">NFR: ${dominioText}</span>`;
  }

  const cardTitle = hipotese ? `H${state.incertezaTotal + 1}: ${hipotese}` : '';
  
  // Monta a descrição formatada como no card real
  let descriptionParts = [];
  
  if (dominio && dominioText) {
    descriptionParts.push(`<strong>${I18N.t('nfrLevelLabel')}</strong> ${dominioText}`);
  }
  
  if (contexto) {
    descriptionParts.push(`<strong>${I18N.t('uncertainty')}</strong> ${contexto}`);
  }
  
  if (incerteza && incertezaText) {
    descriptionParts.push(`<strong>${I18N.t('uncertaintyLevelLabel')}</strong> ${incertezaText}`);
  }
  
  if (impacto && impactoText) {
    descriptionParts.push(`<strong>${I18N.t('impactLevelLabel')}</strong> ${impactoText}`);
  }
  
  const cardDescription = descriptionParts.join('<br>');

  preview.innerHTML = `
    <h2>${I18N.t('previewTitle')}</h2>
    ${cardTitle ? `<div class="card-title">${cardTitle}</div>` : ''}
    ${badgesHTML ? `<div class="card-badges">${badgesHTML}</div>` : ''}
    ${cardDescription ? `<div class="card-description">${cardDescription}</div>` : ''}
  `;
}

// Adiciona listeners para atualizar o preview em tempo real
window.addEventListener('DOMContentLoaded', function() {
  ['contexto','hipotese','dominio','incerteza','impacto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updatePreviewPanel);
      el.addEventListener('change', updatePreviewPanel);
    }
  });
  updatePreviewPanel();
});