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
var cardName = '';

function getBoardIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('boardId');
}

function getCardNameFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cardName');
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
      motivoField.placeholder = 'Explain the reason for the change...';
    } else {
      motivoField.style.display = 'none';
      motivoField.value = '';
    }
  });

  hideLoading(0);
  showStep(1);
}


async function classifyPattern() {
  showLoading(0);
  cardName = getCardNameFromUrl();
  const hypothesis = `${cardName}`;

  const res = await fetch(`/.netlify/functions/classifyPattern`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hypothesis }),
  });

  const data = await res.json();

  document.getElementById('pattern').value = data.pattern;
  document.getElementById('patternResultado').innerHTML = motivoHTML(data.reason);
  hideLoading(0);
  showStep(1);
}

async function analyzePlan() {
  showLoading(1);
  state.pattern = document.getElementById('pattern').value;
  state.patternMotivo = document.getElementById('patternResultado').value;
  const input = `
${cardName};
ArchHypo Pattern: ${state.pattern};
  `;

  const { sugestao, motivo } = await callEndpoint('analyze-plan', input);

  document.getElementById('plano').value = sugestao;
  document.getElementById('planoResultado').innerHTML = motivoHTML(motivo);
  hideLoading(1);
  showStep(2);
}

async function createCard() {
    showLoading(2);
    state.plano = document.getElementById('plano').value;
state.planoMotivo = document.getElementById('planoResultado').value;

const boardId = getBoardIdFromUrl();  // Obtém o boardId da URL

// Separar os bullet points (ajuste o separador conforme necessário)
const bulletPoints = state.plano.split('\n'); // ou use .split('•') se for esse o marcador

for (const bullet of bulletPoints) {
    if (bullet.trim() === '') continue; // Ignora linhas vazias
    bullet = bullet.split(':');
    const data = {
        name: bullet[0].trim(),
        detalhes: bullet[1].trim()
    };

    try {
        const res = await fetch(`/.netlify/functions/create-card?boardId=${boardId}&collumn=1`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
            alert(`Erro ao criar card: ${result.error || result.erro || 'Erro desconhecido'}`);
            continue;
        }

        const cardUrl = result.data.shortUrl || result.data.url;

        // Você pode acumular os links ou exibir todos
        const linkContainer = document.getElementById('cardLink');
        const linkElement = document.createElement('a');
        linkElement.href = cardUrl;
        linkElement.target = '_blank';
        linkElement.innerText = 'Open Card';
        linkContainer.appendChild(linkElement);
        linkContainer.appendChild(document.createElement('br'));
        showStep(3);
    } catch (error) {
        console.error('❌ Request error:', error);
        alert('Error creating the card. Check the console for more details.');
    }
  }
    hideLoading(2);
    showStep(3);
}

function motivoHTML(motivo) {
  return `
    <details>
      <summary><em>Reason: (click here)</em></summary>
      <p>${motivo}</p>
    </details>
  `;
}
