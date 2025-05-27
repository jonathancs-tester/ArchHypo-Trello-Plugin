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
Contexto: ${state.contexto}; 
Hipótese: ${state.hipotese};
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
Contexto: ${state.contexto}; 
Hipótese: ${state.hipotese};
Domínio do Problema: ${state.dominio}; 
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
Contexto: ${state.contexto}; 
Hipótese: ${state.hipotese};
Domínio do Problema: ${state.dominio}; 
Incerteza: ${state.incerteza};
  `;  
  const { sugestao, motivo } = await callEndpoint('analyze-impact', input);

  state.impacto = sugestao;
  state.impactoMotivo = motivo;

  document.getElementById('impacto').value = sugestao;
  document.getElementById('impactoResultado').innerHTML = motivoHTML(motivo);

  showStep(4);
}


async function analyzePlan() {
  const input = `
Contexto: ${state.contexto}; 
Hipótese: ${state.hipotese};
Domínio do Problema: ${state.dominio}; 
Incerteza: ${state.incerteza};
Impacto: ${state.impacto};
  `;

  const { sugestao, motivo } = await callEndpoint('analyze-plan', input);

  state.plano = sugestao;
  state.planoMotivo = motivo;

  document.getElementById('plano').value = sugestao;
  document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);

  showStep(5);
}

async function createCard() {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('boardId');  // Obtém o boardId da URL

    const data = {
        name: "Incerteza: " + state.contexto,
        detalhes:
            "**Domínio do problema:** " + state.dominio + "\n" +
            "**Hipótese:** " + state.hipotese + "\n" +
            "**Incerteza:** " + state.incerteza + "\n" +
            "**Impacto:** " + state.impacto + "\n" +
            "**Plano:** " + state.plano
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

        document.getElementById('cardLink').innerHTML = `<a href="${cardUrl}" target="_blank">Acessar Card no Trello</a>`;
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
      <summary><em>Motivo (clique para ver)</em></summary>
      <p>${motivo}</p>
    </details>
  `;
}
