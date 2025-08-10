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

function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('boardId');
}

function showStep(stepId) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step' + stepId).classList.add('active');
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
  const input = document.getElementById('contexto').value;
  const { sugestao, motivo } = await callEndpoint('analyze-hypothesis', input, query);
  state.contexto = input;
  state.hipotese = sugestao;
  state.hipoteseMotivo = motivo;

  document.getElementById('hipotese').value = sugestao;
  document.getElementById('hipoteseResultado').innerHTML = motivoHTML(motivo);

  showStep(1);
}

async function analyzeDomain() {
  const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
  `;  
  const { sugestao, motivo } = await callEndpoint('analyze-domain', input);

  state.dominio = sugestao;
  state.dominioMotivo = motivo;

  document.getElementById('dominio').value = sugestao;
  document.getElementById('dominioResultado').innerHTML = motivoHTML(motivo);

  showStep(2);
}

async function analyzeUncertainty() {
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

  state.incerteza = sugestao;
  state.incertezaMotivo = motivo;

  document.getElementById('incerteza').value = sugestao;
  document.getElementById('incertezaResultado').innerHTML = motivoHTML(motivo);

  showStep(3);
}

async function analyzeImpact() {

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

  state.impacto = sugestao;
  state.impactoMotivo = motivo;

  document.getElementById('impacto').value = sugestao;
  document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);

  showStep(4);
}


async function classifyPattern() {
  const hypothesis = `${state.hipotese}.`;

  const res = await fetch(`/.netlify/functions/classifyPattern`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hypothesis }),
  });

  const data = await res.json();

  state.pattern = data.pattern;
  state.patternMotivo = data.reason;

  document.getElementById('pattern').value = data.pattern;
  document.getElementById('patternResultado').innerHTML = motivoHTML(data.reason);

  showStep(5);
}

async function analyzePlan() {
  const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
Non Functional Requirement: ${state.dominio}; 
Uncertainty: ${state.incerteza};
Impact: ${state.impacto};
ArchHypo Pattern: ${state.pattern};
  `;

  const { sugestao, motivo } = await callEndpoint('analyze-plan', input);

  state.plano = sugestao;
  state.planoMotivo = motivo;

  document.getElementById('plano').value = sugestao;
  document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);

  showStep(6);
}

async function createCard() {
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
