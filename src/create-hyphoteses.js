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

let currentStep = 5; // ou o passo inicial que você quiser

function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('boardId');
}

function showStep(stepId) {
  currentStep = stepId;
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step' + stepId).classList.add('active');
}

function previousStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  disableButtons();
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  enableButtons();
}

function disableButtons() {
  document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

function enableButtons() {
  document.querySelectorAll('button').forEach(btn => btn.disabled = false);
}


async function callEndpoint(endpoint, input) { 
  showLoading(); 
  const res = await fetch(`/.netlify/functions/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  hideLoading();
  const data = await res.json();
  return data;
}

async function analyzeHypothesis() {
  const input = document.getElementById('contexto').value;
  const { sugestao, motivo } = await callEndpoint('analyze-hypothesis', input);
  state.contexto = input;

  document.getElementById('hipotese').value = sugestao;
  document.getElementById('hipoteseResultado').innerHTML = motivoHTML(motivo);
  
  showStep(1);
}

async function analyzeDomain() {

  state.hipotese = document.getElementById('hipotese').value;
  state.hipoteseMotivo = document.getElementById('hipoteseResultado').value;

  const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
  `;  
  const { sugestao, motivo } = await callEndpoint('analyze-domain', input);

  document.getElementById('dominio').value = sugestao;
  document.getElementById('dominioResultado').innerHTML = motivoHTML(motivo);

  showStep(2);
}

async function analyzeUncertainty() {
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

  document.getElementById('incerteza').value = sugestao;
  document.getElementById('incertezaResultado').innerHTML = motivoHTML(motivo);
  
  showStep(3);
}

async function analyzeImpact() {
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

  document.getElementById('impacto').value = sugestao;
  document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);

  showStep(4);
}


async function classifyPattern() {
  state.impacto = document.getElementById('impacto').value;
  state.impactoMotivo = document.getElementById('impactoResultado').value;
  const hypothesis = `${state.hipotese}.`;

  const res = await fetch(`/.netlify/functions/classifyPattern`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hypothesis }),
  });

  const data = await res.json();

  document.getElementById('pattern').value = data.pattern;
  document.getElementById('patternResultado').innerHTML = motivoHTML(data.reason);

  showStep(5);
}

async function analyzePlan() {
  state.pattern = document.getElementById('pattern').value;
  state.patternMotivo = document.getElementById('patternResultado').value;
  const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
Non Functional Requirement: ${state.dominio}; 
Uncertainty: ${state.incerteza};
Impact: ${state.impacto};
ArchHypo Pattern: ${state.pattern};
  `;

  const { sugestao, motivo } = await callEndpoint('analyze-plan', input);

  document.getElementById('plano').value = sugestao;
  document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);

  showStep(6);
}

async function createCard() {
    state.plano = document.getElementById('plano').value;
    state.planoMotivo = document.getElementById('planoResultado').value;

    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');  // Obtém o boardId da URL

    const data = {
        name: "Uncertainty: " + state.contexto,
        detalhes:
            "**Non Functional Requirement:** " + state.dominio + "\n" +
            "**Hypothesis:** " + state.hipotese + "\n" +
            "**Uncertainty:** " + state.incerteza + "\n" +
            "**Impact:** " + state.impacto + "\n" +
            "**ArchHypo Pattern:** " + state.pattern + "\n" +
            "**Technical Plan:** \n" + state.plano
    };

    try {
        const res = await fetch(`/.netlify/functions/create-card?boardId=${boardId}`, {
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
        showStep(7);
    } catch (error) {
        console.error('❌ Request error:', error);
        alert('Error creating the card. Check the console for more details.');
    }
    showStep(7);
}

function motivoHTML(motivo) {
  return `
    <details>
      <summary><em>Reason: (click here)</em></summary>
      <p>${motivo}</p>
    </details>
  `;
}
