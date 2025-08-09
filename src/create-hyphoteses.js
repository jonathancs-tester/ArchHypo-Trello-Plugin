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
  const { sugestao, motivo } = await callEndpoint('analyze-hypothesis', input);

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
const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
Non Functional Requirement: ${state.dominio}; 
  `;  
  const { sugestao, motivo } = await callEndpoint('analyze-uncertainty', input);

  state.incerteza = sugestao;
  state.incertezaMotivo = motivo;

  document.getElementById('incerteza').value = sugestao;
  document.getElementById('incertezaResultado').innerHTML = motivoHTML(motivo);

  showStep(3);
}

async function analyzeImpact() {
const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
Non Functional Requirement: ${state.dominio}; 
Uncertainty: ${state.incerteza};
  `;  
  const { sugestao, motivo } = await callEndpoint('analyze-impact', input);

  state.impacto = sugestao;
  state.impactoMotivo = motivo;

  document.getElementById('impacto').value = sugestao;
  document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);

  showStep(4);
}


async function classifyPattern() {
  const input = `
hypothesis: ${state.hipotese};
  `;

  const { sugestao, motivo } = await callEndpoint('classifyPattern', input);

  state.pattern = sugestao;
  state.patternMotivo = motivo;

  document.getElementById('pattern').value = sugestao;
  document.getElementById('patternMotivo').innerHTML = motivoHTML(motivo);

  showStep(5);
}

async function analyzePlan() {
  const input = `
Context: ${state.contexto}; 
Hypothesis: ${state.hipotese};
Non Functional Requirement: ${state.dominio}; 
Uncertainty: ${state.incerteza};
Impacto: ${state.impacto};
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
            "**Impacto:** " + state.impacto + "\n" +
            "**ArchHypo Pattern:** " + state.pattern + "\n" +
            "**Technical Plan:** " + state.plano
    };

    try {
        const res = await fetch(`/.netlify/functions/criar-card?boardId=${boardId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            alert(`Erro ao criar card: ${result.erro || result.error || 'Erro desconhecido'}`);
            return;
        }

        const cardUrl = result.data.shortUrl || result.data.url;

        document.getElementById('cardLink').innerHTML = `<a href="${cardUrl}" target="_blank">Open Card</a>`;
        showStep(7);
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        alert('Erro ao criar o card. Verifique o console para mais detalhes.');
    }
    showStep(6);
}

function motivoHTML(motivo) {
  return `
    <details>
      <summary><em>Reason (clique para ver)</em></summary>
      <p>${motivo}</p>
    </details>
  `;
}
