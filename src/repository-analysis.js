// repository-analysis.js - Script para análise de repositório GitHub

const BACKEND_URL = '/.netlify/functions';
let githubToken = null;
let selectedRepository = null;
let selectedFiles = [];
let selectedAnalysisType = 'full';
let currentLanguage = 'pt';
let trelloContext = null;

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
    // Inicializar contexto Trello
    trelloContext = window.TrelloPowerUp.iframe();
    
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const lang = urlParams.get('lang') || 'pt';
    currentLanguage = lang;

    // Se já temos token (retorno do OAuth), pular autenticação
    if (token) {
        githubToken = token;
        document.getElementById('step-auth').classList.add('hidden');
        document.getElementById('step-repo').classList.remove('hidden');
        await loadRepositories();
    }

    // Event Listeners
    document.getElementById('btn-auth').addEventListener('click', authenticateGitHub);
    document.getElementById('btn-analyze').addEventListener('click', analyzeCode);
    document.getElementById('btn-save-to-card').addEventListener('click', saveToCard);

    // Listener para opções de análise
    document.querySelectorAll('.analysis-option').forEach(option => {
        option.addEventListener('click', (e) => {
            document.querySelectorAll('.analysis-option').forEach(o => o.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            selectedAnalysisType = e.currentTarget.dataset.type;
        });
    });
});

// Autenticação GitHub
async function authenticateGitHub() {
    try {
        const response = await fetch(`${BACKEND_URL}/github-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getAuthUrl' })
        });

        const data = await response.json();
        
        if (data.authUrl) {
            // Abrir janela de autenticação
            window.location.href = data.authUrl;
        } else {
            showError('Erro ao gerar URL de autenticação');
        }
    } catch (error) {
        console.error('Erro na autenticação:', error);
        showError('Erro ao conectar com GitHub: ' + error.message);
    }
}

// Carregar repositórios
async function loadRepositories() {
    try {
        const response = await fetch(`${BACKEND_URL}/github-repositories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: githubToken })
        });

        const data = await response.json();
        
        if (data.repositories) {
            displayRepositories(data.repositories);
        } else {
            showError('Nenhum repositório encontrado');
        }
    } catch (error) {
        console.error('Erro ao carregar repositórios:', error);
        showError('Erro ao buscar repositórios: ' + error.message);
    }
}

// Exibir lista de repositórios
function displayRepositories(repositories) {
    const repoList = document.getElementById('repo-list');
    repoList.innerHTML = '';

    repositories.forEach(repo => {
        const repoItem = document.createElement('div');
        repoItem.className = 'repo-item';
        repoItem.innerHTML = `
            <div class="repo-name">📦 ${repo.full_name}</div>
            <div class="repo-desc">${repo.description || 'Sem descrição'}</div>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 5px;">
                ${repo.language ? `💻 ${repo.language}` : ''} • 
                ${repo.private ? '🔒 Privado' : '🌐 Público'}
            </div>
        `;
        
        repoItem.addEventListener('click', () => selectRepository(repo, repoItem));
        repoList.appendChild(repoItem);
    });
}

// Selecionar repositório
async function selectRepository(repo, element) {
    // Marcar como selecionado
    document.querySelectorAll('.repo-item').forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    
    selectedRepository = repo;

    // Carregar arquivos do repositório
    await loadFiles(repo);

    // Mostrar próximo passo
    document.getElementById('step-files').classList.remove('hidden');
}

// Carregar arquivos do repositório
async function loadFiles(repo) {
    try {
        const response = await fetch(`${BACKEND_URL}/github-get-files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: githubToken,
                repository: repo.full_name,
                branch: repo.default_branch || 'main'
            })
        });

        const data = await response.json();
        
        if (data.files) {
            displayFiles(data.files);
        }
    } catch (error) {
        console.error('Erro ao carregar arquivos:', error);
        showError('Erro ao buscar arquivos: ' + error.message);
    }
}

// Exibir árvore de arquivos
function displayFiles(files) {
    const fileTree = document.getElementById('file-tree');
    fileTree.innerHTML = '';

    // Filtrar apenas arquivos de código (não pastas)
    const codeFiles = files.filter(file => 
        file.type === 'file' && 
        isCodeFile(file.name)
    );

    if (codeFiles.length === 0) {
        fileTree.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">Nenhum arquivo de código encontrado na raiz. Tente selecionar uma pasta específica.</p>';
        return;
    }

    codeFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'file-checkbox';
        checkbox.id = `file-${file.sha}`;
        
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (selectedFiles.length >= 20) {
                    e.target.checked = false;
                    showError('Máximo de 20 arquivos permitidos');
                    return;
                }
                selectedFiles.push(file);
                fileItem.classList.add('selected');
            } else {
                selectedFiles = selectedFiles.filter(f => f.sha !== file.sha);
                fileItem.classList.remove('selected');
            }
            updateAnalyzeButton();
        });

        const label = document.createElement('label');
        label.htmlFor = `file-${file.sha}`;
        label.style.cursor = 'pointer';
        label.style.flex = '1';
        label.textContent = `${getFileIcon(file.name)} ${file.path}`;

        fileItem.appendChild(checkbox);
        fileItem.appendChild(label);
        fileTree.appendChild(fileItem);
    });

    // Mostrar próximo passo
    document.getElementById('step-analysis').classList.remove('hidden');
}

// Verificar se é arquivo de código
function isCodeFile(filename) {
    const codeExtensions = [
        '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', 
        '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.sql',
        '.html', '.css', '.scss', '.sass', '.vue', '.json', '.xml', '.yaml', '.yml'
    ];
    return codeExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Ícone do arquivo
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'js': '📜', 'jsx': '⚛️', 'ts': '📘', 'tsx': '⚛️',
        'py': '🐍', 'java': '☕', 'cpp': '⚙️', 'c': '⚙️',
        'cs': '🎯', 'go': '🐹', 'rs': '🦀', 'rb': '💎',
        'php': '🐘', 'swift': '🦅', 'kt': '🎨', 'html': '🌐',
        'css': '🎨', 'json': '📋', 'sql': '🗃️'
    };
    return icons[ext] || '📄';
}

// Atualizar botão de análise
function updateAnalyzeButton() {
    const btnAnalyze = document.getElementById('btn-analyze');
    btnAnalyze.disabled = selectedFiles.length === 0;
}

// Analisar código
async function analyzeCode() {
    if (selectedFiles.length === 0) {
        showError('Selecione pelo menos um arquivo para análise');
        return;
    }

    // Mostrar loading
    document.getElementById('loading').classList.add('active');
    document.getElementById('btn-analyze').disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/analyze-repository`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: githubToken,
                repository: selectedRepository.full_name,
                files: selectedFiles,
                language: currentLanguage,
                analysisType: selectedAnalysisType
            })
        });

        const data = await response.json();
        
        if (data.analysis) {
            displayResults(data);
        } else {
            showError('Erro ao processar análise');
        }
    } catch (error) {
        console.error('Erro na análise:', error);
        showError('Erro ao analisar código: ' + error.message);
    } finally {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('btn-analyze').disabled = false;
    }
}

// Exibir resultados
function displayResults(data) {
    const resultsContent = document.getElementById('results-content');
    const analysis = data.analysis;

    let html = `
        <div class="alert alert-success">
            <strong>✅ Análise concluída!</strong><br>
            Repositório: <strong>${data.repository}</strong><br>
            Arquivos analisados: <strong>${data.files_analyzed}</strong><br>
            Tipo: <strong>${getAnalysisTypeName(data.analysis_type)}</strong>
        </div>
    `;

    // Se temos análise estruturada
    if (analysis.arquitetura) {
        html += formatFullAnalysis(analysis);
    } else if (analysis.raw_analysis) {
        html += `<div style="margin-top: 15px;"><pre>${analysis.raw_analysis}</pre></div>`;
    } else {
        html += `<div style="margin-top: 15px;"><pre>${JSON.stringify(analysis, null, 2)}</pre></div>`;
    }

    resultsContent.innerHTML = html;
    document.getElementById('results').classList.add('active');

    // Armazenar resultado para salvar no card
    window.analysisResult = data;
}

// Formatar análise completa
function formatFullAnalysis(analysis) {
    let html = '';

    // Resumo
    if (analysis.resumo) {
        html += `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7; margin-bottom: 20px;">
                <strong>📝 Resumo Executivo:</strong>
                <p style="margin-top: 10px; line-height: 1.6;">${analysis.resumo}</p>
            </div>
        `;
    }

    // Arquitetura
    if (analysis.arquitetura) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">🏗️ Arquitetura</h4>
                <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
                    <strong>Padrão:</strong> ${analysis.arquitetura.padrao}<br>
                    <strong>Qualidade:</strong> <span style="color: ${getQualityColor(analysis.arquitetura.qualidade)}">${analysis.arquitetura.qualidade}</span><br>
                    <p style="margin-top: 10px;">${analysis.arquitetura.descricao}</p>
                </div>
            </div>
        `;
    }

    // Métricas
    if (analysis.metricas) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">📊 Métricas</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                    ${Object.entries(analysis.metricas).map(([key, value]) => `
                        <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; text-align: center;">
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">${key}</div>
                            <div style="font-size: 18px; font-weight: 600; color: #333; margin-top: 5px;">${value}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Melhorias
    if (analysis.melhorias && analysis.melhorias.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #667eea; margin-bottom: 10px;">💡 Melhorias Recomendadas</h4>
                ${analysis.melhorias.map(m => `
                    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid ${getPriorityColor(m.prioridade)}; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <strong style="color: #333;">${m.descricao}</strong>
                            <span style="background: ${getPriorityColor(m.prioridade)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                ${m.prioridade}
                            </span>
                        </div>
                        <div style="font-size: 13px; color: #6b7280;">
                            <strong>Categoria:</strong> ${m.categoria}<br>
                            <strong>Impacto:</strong> ${m.impacto}
                            ${m.localizacao ? `<br><strong>Local:</strong> ${m.localizacao}` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Segurança
    if (analysis.seguranca && analysis.seguranca.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #ef4444; margin-bottom: 10px;">🔒 Questões de Segurança</h4>
                ${analysis.seguranca.map(s => `
                    <div style="background: #fef2f2; padding: 15px; border-radius: 6px; border-left: 4px solid ${getSeverityColor(s.severidade)}; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <strong style="color: #991b1b;">${s.tipo}</strong>
                            <span style="background: ${getSeverityColor(s.severidade)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                ${s.severidade}
                            </span>
                        </div>
                        <div style="font-size: 13px; color: #6b7280; margin-bottom: 10px;">
                            ${s.descricao}
                            ${s.localizacao ? `<br><strong>Local:</strong> ${s.localizacao}` : ''}
                        </div>
                        <div style="background: white; padding: 10px; border-radius: 4px; font-size: 13px;">
                            <strong>✅ Recomendação:</strong> ${s.recomendacao}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    return html;
}

// Salvar no card do Trello
async function saveToCard() {
    if (!window.analysisResult) {
        showError('Nenhuma análise disponível para salvar');
        return;
    }

    try {
        const result = window.analysisResult;
        
        // Criar anexo com o resultado completo
        const attachmentData = {
            name: `Análise de Código - ${result.repository}`,
            url: result.repository_url || `https://github.com/${result.repository}`
        };

        // Adicionar comentário com resumo da análise
        const comment = formatCommentFromAnalysis(result);
        
        await trelloContext.attach({
            name: attachmentData.name,
            url: attachmentData.url
        });

        // Adicionar comentário
        const card = await trelloContext.card('id');
        
        // Usar API do Trello para adicionar comentário
        // (isso requer implementação adicional ou uso de função serverless)

        // Salvar dados customizados no card
        await trelloContext.set('card', 'shared', 'codeAnalysis', {
            repository: result.repository,
            timestamp: result.timestamp,
            analysis: result.analysis,
            files_analyzed: result.files_analyzed
        });

        showSuccess('Análise salva no card com sucesso!');
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
            trelloContext.closeModal();
        }, 2000);

    } catch (error) {
        console.error('Erro ao salvar no card:', error);
        showError('Erro ao salvar análise: ' + error.message);
    }
}

// Formatar comentário da análise
function formatCommentFromAnalysis(result) {
    const analysis = result.analysis;
    let comment = `## 🔍 Análise de Código - ${result.repository}\n\n`;
    comment += `**Data:** ${new Date(result.timestamp).toLocaleString()}\n`;
    comment += `**Arquivos analisados:** ${result.files_analyzed}\n\n`;

    if (analysis.resumo) {
        comment += `### 📝 Resumo\n${analysis.resumo}\n\n`;
    }

    if (analysis.arquitetura) {
        comment += `### 🏗️ Arquitetura\n`;
        comment += `- **Padrão:** ${analysis.arquitetura.padrao}\n`;
        comment += `- **Qualidade:** ${analysis.arquitetura.qualidade}\n\n`;
    }

    if (analysis.melhorias && analysis.melhorias.length > 0) {
        comment += `### 💡 Principais Melhorias\n`;
        analysis.melhorias.slice(0, 3).forEach((m, i) => {
            comment += `${i + 1}. **[${m.prioridade}]** ${m.descricao}\n`;
        });
    }

    return comment;
}

// Funções auxiliares
function getAnalysisTypeName(type) {
    const types = {
        'full': 'Análise Completa',
        'architecture': 'Arquitetura',
        'patterns': 'Padrões de Projeto',
        'practices': 'Boas Práticas',
        'security': 'Segurança'
    };
    return types[type] || type;
}

function getQualityColor(quality) {
    const colors = {
        'excelente': '#10b981',
        'boa': '#3b82f6',
        'regular': '#f59e0b',
        'precisa melhorias': '#ef4444'
    };
    return colors[quality?.toLowerCase()] || '#6b7280';
}

function getPriorityColor(priority) {
    const colors = {
        'alta': '#ef4444',
        'média': '#f59e0b',
        'media': '#f59e0b',
        'baixa': '#3b82f6'
    };
    return colors[priority?.toLowerCase()] || '#6b7280';
}

function getSeverityColor(severity) {
    const colors = {
        'crítica': '#991b1b',
        'critica': '#991b1b',
        'alta': '#dc2626',
        'média': '#f59e0b',
        'media': '#f59e0b',
        'baixa': '#3b82f6'
    };
    return colors[severity?.toLowerCase()] || '#6b7280';
}

function showError(message) {
    // Implementar notificação de erro
    alert(message);
}

function showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
}
