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

  // Expandir as traduções
const translations = {
  pt: {
    placeholders: {
      contexto: "Descreva a incerteza, situação ou contexto em detalhes...",
      loading: "⏳ Processando...",
      next: "Próximo",
      previous: "Anterior"
    },
    messages: {
      confirmLeave: "As informações preenchidas serão perdidas. Deseja voltar mesmo assim?",
      createCardError: "Erro ao criar o card:",
      checkConsole: "Verifique o console para mais detalhes.",
      justification: "Justificativa: (clique aqui)",
      objective: "**Objetivo:**",
      description: "**Descrição:**",
      domain: "**Domínio:**",
      uncertainty: "**Incerteza:**",
      impact: "**Impacto:**"
    }
  },
  en: {
    placeholders: {
      contexto: "Describe the uncertainty, situation or context in detail...",
      loading: "⏳ Processing...",
      next: "Next",
      previous: "Previous"
    },
    messages: {
      confirmLeave: "The filled information will be lost. Do you really want to go back?",
      createCardError: "Error creating card:",
      checkConsole: "Check console for more details.",
      justification: "Justification: (click here)",
      objective: "**Objective:**",
      description: "**Description:**",
      domain: "**Domain:**",
      uncertainty: "**Uncertainty:**",
      impact: "**Impact:**"
    }
  }
};

// Função para atualizar textos
function updateTexts(language) {
  const texts = translations[language];
  
  const contextoTextarea = document.getElementById('contexto');
  if (contextoTextarea) {
    contextoTextarea.placeholder = texts.placeholders.contexto;
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

// Inicializar textos no carregamento
document.addEventListener('DOMContentLoaded', () => {
  updateTexts(state.language);
});

  function getBoardIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('boardId');
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

  async function analyzeHypothesis() {
    try {
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

      hipoteseField.addEventListener('input', function () {
        const sugestaoAtual = this.value;
        if (sugestaoAtual !== sugestaoOriginal) {
          motivoField.style.display = 'block';
          motivoField.placeholder = 'Justifique a alteração...';
        } else {
          motivoField.style.display = 'none';
          motivoField.value = '';
        }
      });

      showStep(1);
    } catch (error) {
      console.error('❌ Erro ao analisar hipótese:', error.message || error);
      alert(`${t('messages.createCardError')} ${error.message || t('messages.checkConsole')}`);
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
  Context: ${state.contexto}; 
  Hypothesis: ${state.hipotese};
      `;  
      const { sugestao, motivo } = await callEndpoint('analyze-domain', input);

      sugestaoOriginal = sugestao;
      const dominioField = document.getElementById('dominio');
      const motivoField = document.getElementById('dominioMotivo');

      dominioField.value = sugestao;
      document.getElementById('dominioResultado').innerHTML = motivoHTML(motivo);
      dominioField.style.display = 'block';
      motivoField.style.display = 'none'; 

      dominioField.addEventListener('input', function () {
        const sugestaoAtual = this.value;
        if (sugestaoAtual !== sugestaoOriginal) {
          motivoField.style.display = 'block';
          motivoField.placeholder = 'Justifique a alteração...';
        } else {
          motivoField.style.display = 'none';
          motivoField.value = '';
        }
      });

      showStep(2);
    } catch (error) {
      console.error('❌ Erro ao analisar domínio:', error.message || error);
      alert(`${t('messages.createCardError')} ${error.message || t('messages.checkConsole')}`);
    } finally {
      hideLoading(1);
    }
  }

  async function analyzeUncertainty() {
    try {
      showLoading(2);
      state.dominio = document.getElementById('dominio').value;
      state.dominioMotivo = document.getElementById('dominioResultado').value;

      const boardId = getBoardIdFromUrl();
      const query = `boardId=${boardId}&column=HIPÓTESES`;   

      const res = await fetch(`/.netlify/functions/get-uncertainty?` + query, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const allData = await res.json();
      state.incertezaTotal = allData?.length || 0;
      const data = allData ? allData.slice(0, 10) : [];

      const uncertaintyHistoricalStr = Array.isArray(data)
        ? data.map(item => {
            const { totalCards, ...rest } = item;
            return JSON.stringify(rest);
          }).join('; ')
        : data;

      // Confirmação do uso do histórico
      const usarHistorico = confirm("Deseja usar o histórico de incerteza na análise?");
      
      const input = `
        Context: ${state.contexto}; 
        Hypothesis: ${state.hipotese};
        Non Functional Requirement: ${state.dominio}; 
        ${usarHistorico ? `Uncertainty Historical: ${uncertaintyHistoricalStr};` : ''}
      `;

      const { sugestao, motivo } = await callEndpoint('analyze-uncertainty', input);

      sugestaoOriginal = sugestao;
      const incertezaField = document.getElementById('incerteza');
      const motivoField = document.getElementById('incertezaMotivo');

      incertezaField.value = sugestao;
      document.getElementById('incertezaResultado').innerHTML = motivoHTML(motivo);
      incertezaField.style.display = 'block';
      motivoField.style.display = 'none'; 

      incertezaField.addEventListener('input', function () {
        const sugestaoAtual = this.value;
        if (sugestaoAtual !== sugestaoOriginal) {
          motivoField.style.display = 'block';
          motivoField.placeholder = 'Justifique a alteração...';
        } else {
          motivoField.style.display = 'none';
          motivoField.value = '';
        }
      });

      showStep(3);
    } catch (error) {
      console.error('❌ Erro ao analisar incerteza:', error.message || error);
      alert(`${t('messages.createCardError')} ${error.message || t('messages.checkConsole')}`);
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
      const query = `boardId=${boardId}&column=HIPÓTESES`;   

      const res = await fetch(`/.netlify/functions/get-impact?` + query, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const allData = await res.json();
      const data = allData ? allData.slice(0, 10) : [];
      const impactHistoricalStr = Array.isArray(data)
        ? data.map(item => JSON.stringify(item)).join('; ')
        : data;

      // Confirmação do uso do histórico
      const usarHistorico = confirm("Deseja usar o histórico de impacto na análise?");
      
      const input = `
        Context: ${state.contexto}; 
        Hypothesis: ${state.hipotese};
        Non Functional Requirement: ${state.dominio}; 
        Uncertainty: ${state.incerteza};
        ${usarHistorico ? `Impact Historical: ${impactHistoricalStr};` : ''}
      `;

      const { sugestao, motivo } = await callEndpoint('analyze-impact', input);

      sugestaoOriginal = sugestao;
      const impactoField = document.getElementById('impacto');
      const motivoField = document.getElementById('impactoMotivo');

      impactoField.value = sugestao;
      document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);
      impactoField.style.display = 'block';
      motivoField.style.display = 'none'; 

      impactoField.addEventListener('input', function () {
        const sugestaoAtual = this.value;
        if (sugestaoAtual !== sugestaoOriginal) {
          motivoField.style.display = 'block';
          motivoField.placeholder = 'Justifique a alteração...';
        } else {
          motivoField.style.display = 'none';
          motivoField.value = '';
        }
      });

      showStep(4);
    } catch (error) {
      console.error('❌ Erro ao analisar impacto:', error.message || error);
      alert(`${t('messages.createCardError')} ${error.message || t('messages.checkConsole')}`);
    } finally {
      hideLoading(3);
    }
  }

  async function createCard() {
    try {
      showLoading(4);
      state.impacto = document.getElementById('impacto').value;
      state.impactoMotivo = document.getElementById('impactoResultado').value;

      const urlParams = new URLSearchParams(window.location.search);
      const boardId = urlParams.get('boardId');  
      const data = {
          name: "H"+(state.incertezaTotal+1)+": " + state.hipotese,
          detalhes:
              "**Requisitos Não Funcionais:** " + state.dominio + "\n" +
              "**Incerteza:** " + state.contexto + "\n" +
              "**Nível de Incerteza:** " + state.incerteza + "\n" +
              "**Nível de Impacto:** " + state.impacto
      };

      const res = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=HIPÓTESES`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.hipotese,
          detalhes: `${t('messages.objective')} ${state.hipoteseMotivo}\n${t('messages.domain')} ${state.dominio}\n${t('messages.uncertainty')} ${state.incerteza}\n${t('messages.impact')} ${state.impacto}`
        })
      });

          const result = await res.json();

          if (!res.ok) {
              alert(`Error creating card: ${result.error || result.erro || 'Unknown error'}`);
              return;
          }

          const cardUrl = result.data.shortUrl || result.data.url;

          document.getElementById('cardLink').innerHTML = `<a href="${cardUrl}" target="_blank">${data.name}</a>`;
          showStep(5);
      } catch (error) {
        console.error('❌ Erro ao criar o card:', error.message || error);
        alert(`${t('messages.createCardError')} ${error.message || t('messages.checkConsole')}`);
      } finally {
        hideLoading(3);
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
