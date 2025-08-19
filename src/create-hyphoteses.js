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
  plano: '',
  planoMotivo: '',
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
  if (currentStep >= 0) {
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

  // Atualiza sugestão e resultado
  sugestaoOriginal = sugestao;
  const hipoteseField = document.getElementById('hipotese');
  const motivoField = document.getElementById('hipoteseMotivo');

  hipoteseField.value = sugestao;
  document.getElementById('hipoteseResultado').innerHTML = motivoHTML(motivo);
  hipoteseField.style.display = 'block';
  motivoField.style.display = 'none'; // esconde o campo de motivo inicialmente

  // Adiciona listener para detectar alterações
  hipoteseField.addEventListener('input', function () {
    const sugestaoAtual = this.value;
    if (sugestaoAtual !== sugestaoOriginal) {
      motivoField.style.display = 'block';
      motivoField.placeholder = 'Explique o motivo da alteração...';
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

  // Atualiza sugestão e resultado
  sugestaoOriginal = sugestao;
  const dominioField = document.getElementById('dominio');
  const motivoField = document.getElementById('dominioMotivo');

  dominioField.value = sugestao;
  document.getElementById('dominioResultado').innerHTML = motivoHTML(motivo);
  dominioField.style.display = 'block';
  motivoField.style.display = 'none'; // esconde o campo de motivo inicialmente

  // Adiciona listener para detectar alterações
  dominioField.addEventListener('input', function () {
    const sugestaoAtual = this.value;
    if (sugestaoAtual !== sugestaoOriginal) {
      motivoField.style.display = 'block';
      motivoField.placeholder = 'Explique o motivo da alteração...';
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
  const query = `boardId=${boardId} `;   

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

  // Atualiza sugestão e resultado
  sugestaoOriginal = sugestao;
  const incertezaField = document.getElementById('incerteza');
  const motivoField = document.getElementById('incertezaMotivo');

  incertezaField.value = sugestao;
  document.getElementById('incertezaResultado').innerHTML = motivoHTML(motivo);
  incertezaField.style.display = 'block';
  motivoField.style.display = 'none'; // esconde o campo de motivo inicialmente

  // Adiciona listener para detectar alterações
  incertezaField.addEventListener('input', function () {
    const sugestaoAtual = this.value;
    if (sugestaoAtual !== sugestaoOriginal) {
      motivoField.style.display = 'block';
      motivoField.placeholder = 'Explique o motivo da alteração...';
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
  const query = `boardId=${boardId} `;   

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

   // Atualiza sugestão e resultado
  sugestaoOriginal = sugestao;
  const impactoField = document.getElementById('impacto');
  const motivoField = document.getElementById('impactoMotivo');

  impactoField.value = sugestao;
  document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);
  impactoField.style.display = 'block';
  motivoField.style.display = 'none'; // esconde o campo de motivo inicialmente

  // Adiciona listener para detectar alterações
  impactoField.addEventListener('input', function () {
    const sugestaoAtual = this.value;
    if (sugestaoAtual !== sugestaoOriginal) {
      motivoField.style.display = 'block';
      motivoField.placeholder = 'Explique o motivo da alteração...';
    } else {
      motivoField.style.display = 'none';
      motivoField.value = '';
    }
  });
  
  hideLoading(3);
  showStep(4);
}


// async function classifyPattern() {
//   showLoading(4);
//   state.impacto = document.getElementById('impacto').value;
//   state.impactoMotivo = document.getElementById('impactoResultado').value;
//   const hypothesis = `${state.hipotese}.`;

//   const res = await fetch(`/.netlify/functions/classifyPattern`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ hypothesis }),
//   });

//   const data = await res.json();

//   document.getElementById('pattern').value = data.pattern;
//   document.getElementById('patternResultado').innerHTML = motivoHTML(data.reason);
//   hideLoading(4);
//   showStep(5);
// }

// async function analyzePlan() {
//   showLoading(5);
//   state.pattern = document.getElementById('pattern').value;
//   state.patternMotivo = document.getElementById('patternResultado').value;
//   const input = `
// Context: ${state.contexto}; 
// Hypothesis: ${state.hipotese};
// Non Functional Requirement: ${state.dominio}; 
// Uncertainty: ${state.incerteza};
// Impact: ${state.impacto};
//   `;

//   const { sugestao, motivo } = await callEndpoint('analyze-plan', input);

//   document.getElementById('plano').value = sugestao;
//   document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);
//   hideLoading(5);
//   showStep(6);
// }

async function createCard() {
    showLoading(4);
    state.impacto = document.getElementById('impacto').value;
    state.impactoMotivo = document.getElementById('impactoResultado').value;
    // state.plano = document.getElementById('plano').value;
    // state.planoMotivo = document.getElementById('planoResultado').value;

    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');  // Obtém o boardId da URL

    const data = {
        name: "Hypothesis: " + state.hipotese,
        detalhes:
            "**Non Functional Requirement:** " + state.dominio + "\n" +
            "**Uncertainty:** " + state.contexto + "\n" +
            "**Uncertainty Level:** " + state.incerteza + "\n" +
            "**Impact Level:** " + state.impacto
    };

    try {
        const res = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&&collumn=0`, {
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

        document.getElementById('cardLink').innerHTML = `<a href="${cardUrl}" target="_blank">Open Card</a>`;
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
