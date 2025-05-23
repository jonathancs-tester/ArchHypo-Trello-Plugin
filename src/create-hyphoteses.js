let hipotese = '';
let impacto = '';
let impactoMotivo = '';
let incerteza = '';
let incertezaMotivo = '';

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
}

async function analyzeImpact() {
    hipotese = document.getElementById('hipotese').value;
    if (!hipotese) return alert('Digite uma hipótese.');

    const res = await fetch('/.netlify/functions/analyze-impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hipotese }),
    });

    const data = await res.json();
    impacto = data.impacto;
    impactoMotivo = data.motivo;

    document.getElementById('impactoResultado').innerHTML = `
        <strong>Impacto sugerido:</strong> ${impacto}<br>
        <details>
            <summary><em>Motivo (clique para ver)</em></summary>
            <p>${impactoMotivo}</p>
        </details>
    `;
    showStep('step2');
}

async function analyzeUncertainty() {
    const impactoManual = document.getElementById('impactoManual').value;
    impacto = impactoManual || impacto;

    const res = await fetch('/.netlify/functions/analyze-uncertainty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hipotese, impacto }),
    });

    const data = await res.json();
    incerteza = data.incerteza;
    incertezaMotivo = data.motivo;

    document.getElementById('incertezaResultado').innerHTML = `
        <strong>Incerteza sugerida:</strong> ${incerteza}<br>
        <details>
            <summary><em>Motivo (clique para ver)</em></summary>
            <p>${incertezaMotivo}</p>
        </details>
    `;
    showStep('step3');
}

async function createCard() {
    const incertezaManual = document.getElementById('incertezaManual').value;
    incerteza = incertezaManual || incerteza;

    const res = await fetch('/.netlify/functions/create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hipotese, impacto, incerteza }),
    });

    const data = await res.json();

    document.getElementById('cardLink').innerHTML = `<a href="${data.url}" target="_blank">Acessar Card no Trello</a>`;
    showStep('step4');
}
