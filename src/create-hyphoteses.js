  const state = {
    contexto: '',
    incerteza: '',
    incertezaMotivo: '',
    impacto: '',
    impactoMotivo: '',
    hipotese: '',
    hipoteseMotivo: '',
    dominio: '',
    dominioMotivo: '',
  };

  let currentStep = 0;
  let sugestaoOriginal = '';

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

  async function analyzeHypothesis() {
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
        motivoField.placeholder = 'Explain the reason for the change...';
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    hideLoading(0);
    showStep(1);
  }

  async function analyzeDomain() {
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
        motivoField.placeholder = 'Explain the reason for the change...';
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    hideLoading(1);
    showStep(2);
  }

  async function analyzeUncertainty() {
    showLoading(2);
    state.dominio = document.getElementById('dominio').value;
    state.dominioMotivo = document.getElementById('dominioResultado').value;
    const boardId = getBoardIdFromUrl();
    const query = `boardId=${boardId}&column=UNCERTAINTY`;   

    const res = await fetch(`/.netlify/functions/get-uncertainty?`+query, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    const uncertaintyHistoricalStr = Array.isArray(data)
    ? data.map(item => JSON.stringify(item)).join('; ')
    : data;

  const input = `
  Context: ${state.contexto}; 
  Hypothesis: ${state.hipotese};
  Non Functional Requirement: ${state.dominio}; 
  Uncertainty Historical: ${uncertaintyHistoricalStr};
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
        motivoField.placeholder = 'Explain the reason for the change...';
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });
    hideLoading(2);
    showStep(3);
  }

  async function analyzeImpact() {
    showLoading(3);
    state.incerteza = document.getElementById('incerteza').value;
    state.incertezaMotivo = document.getElementById('incertezaResultado').value;

    const boardId = getBoardIdFromUrl();
    const query = `boardId=${boardId}&column=UNCERTAINTY`;   

    const res = await fetch(`/.netlify/functions/get-impact?`+query, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    const impactHistoricalStr = Array.isArray(data)
    ? data.map(item => JSON.stringify(item)).join('; ')
    : data;

  const input = `
  Context: ${state.contexto}; 
  Hypothesis: ${state.hipotese};
  Non Functional Requirement: ${state.dominio}; 
  Uncertainty: ${state.incerteza};
  Impact Historical: ${impactHistoricalStr};
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
        motivoField.placeholder = 'Explain the reason for the change...';
      } else {
        motivoField.style.display = 'none';
        motivoField.value = '';
      }
    });

    hideLoading(3);
    showStep(4);
  }

  async function createCard() {
      showLoading(4);
      state.impacto = document.getElementById('impacto').value;
      state.impactoMotivo = document.getElementById('impactoResultado').value;

      const urlParams = new URLSearchParams(window.location.search);
      const boardId = urlParams.get('boardId');  

      const data = {
          name: "Hypothesis: " + state.hipotese,
          detalhes:
              "**Non Functional Requirement:** " + state.dominio + "\n" +
              "**Uncertainty:** " + state.contexto + "\n" +
              "**Uncertainty Level:** " + state.incerteza + "\n" +
              "**Impact Level:** " + state.impacto
      };

      try {
          const res = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&column=UNCERTAINTY`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
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
          console.error('❌ Request error:', error);
          alert('Error creating the card. Check the console for more details.');
      }
      hideLoading(4);
      showStep(5);
  }

  function motivoHTML(motivo) {
    return `
      <details>
        <summary><em>Reason: (click here)</em></summary>
        <p>${motivo}</p>
      </details>
    `;
  }
