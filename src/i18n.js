// Internationalization system for ArchHypo Trello Plugin
const I18N = {
    translations: {
        pt: {
            previewTitle: "Pré-visualização",
            fillFieldsToPreview: "Preencha os campos para visualizar o preview do card",
            // Main plugin
            pluginTitle: "ArchHypo.AI - Trello Power App",
            selectLanguage: "Selecionar Idioma",

            //List
            col5: "CONCLUIDO",
            col4: "EM ANDAMENTO",
            col3: "A FAZER",
            col2: "ITEM PLANO TECNICO",
            col1: "INCERTEZA",

            // Card buttons
            technicalPlan: "Plano Técnico",
            addUpdateMetric: "Add/Atualizar Métrica",

            // Board buttons
            archHypoMetrics: "ArchHypo Métricas",
            newUncertainty: "Nova Incerteza",
            createBoardTemplate: "Criar Modelo de Quadro",
            context: "Contexto",

            // Modals
            generateTechnicalPlan: "Gerar Plano Técnico",

            // Error messages
            errorCardTitle: "Erro ao obter o título do card!",
            errorUnexpected: "Erro inesperado!",
            errorNoCards: "Nenhum cartão encontrado!",
            errorRetrievingCards: "Erro ao recuperar cartões:",
            errorProcessingCard: "Erro ao processar o card:",
            errorCreateBoardTemplate: "Falha ao criar modelo de quadro. Verifique o console para detalhes.",
            errorGettingCardTitle: "Erro: Não foi possível obter o título do card.",
            errorProcessingBadges: "Erro ao processar badges:",

            // Success messages
            fieldsUpdatedSuccess: "Campos adicionados/atualizados com sucesso!",
            successCreateBoardTemplate: "Modelo de quadro criado com sucesso!",

            // Board template refresh
            refreshBoardToSeeButtons: "Atualize a página do Trello para ver os botões do quadro atualizados.",

            // Historical
            uncertaintyTitle: "Histórico de Incerteza",
            impactTitle: "Histórico de Impacto",
            hypothesesHistorical: "Hipóteses",
            uncertaintyHistorical: "Avaliação de Incerteza",
            impactHistorical: "Avaliação de Impacto",
            useHistorical: "Usar Histórico",
            ignoreHistorical: "Ignorar",

            // Badge labels
            uncertaintyBadge: "Incerteza",
            impactBadge: "Impacto",
            nfrBadge: "NFR",
            archHypoPatternBadge: "Padrão ArchHypo",
            metricsSuccess: "Métricas habilitadas ✅",
            metricsFailed: "Métricas desabilitadas ❌",

            // Levels
            veryLow: "Muito Baixo",
            low: "Baixo",
            medium: "Médio",
            high: "Alto",
            veryHigh: "Muito Alto",

            // NFR domains
            performance: "Desempenho",
            security: "Segurança",
            reliability: "Confiabilidade",
            flexibility: "Flexibilidade",
            usability: "Usabilidade",
            productivity: "Productividade",

            // Comments
            commentTechnicalPlan: "Botão \"Plano Técnico\" só aparece se o título do card não tiver \"TPI\"",
            commentMetricButton: "Botão \"Add/Atualizar Métrica\" sempre aparece",

            // Hypotheses page
            createHypothesesTitle: "ArchHypo.AI - Criar Hipóteses",
            step0Title: "🟢 Incerteza",
            step1Title: "1. Hipótese",
            step2Title: "2. Requisito Não Funcional (NFR)",
            step3Title: "3. Avaliação de Incerteza",
            step4Title: "4. Avaliação de Impacto",
            step5Title: "✅ Card criado!",

            // Buttons
            next: "Próximo",
            previous: "Anterior",
            create: "Criar",
            loading: "⏳ Processando...",

            // Placeholders
            contextPlaceholder: "Descreva a incerteza, situação ou contexto em detalhes...",

            // Technical Plan page
            technicalPlanTitle: "ArchHypo.AI - Plano Técnico",
            techPlanStep0Title: "1. Plano Técnico",
            techPlanStep1Title: "1. Editar Plano Técnico",
            techPlanStep2Title: "2. Padrão ArchHypo",
            techPlanStep3Title: "✅ Itens do Plano Técnico criados!",
            generate: "Gerar",
            edit: "Editar",

            // Metrics page
            metricsTitle: "ArchHypo.AI Métricas",
            uncertaintyChart: "Incerteza",
            nfrChart: "Requisitos Não Funcionais (NFR)",
            patternsChart: "Padrões ArchHypo",
            precisionAt5: "Precision@5",
            hitRate: "Hit Rate",
            mrr: "MRR",
            factualConsistency: "Consistência Factual",
            relevanceScore: "Relevância da Resposta",

            // Placeholders
            contextPlaceholder: "Descreva a incerteza, situação ou contexto em detalhes...",

            // HTML page titles
            createHypothesesPageTitle: "ArchHypo.AI - Criar Hipóteses",
            technicalPlanPageTitle: "ArchHypo.AI - Plano Técnico",
            metricsPageTitle: "ArchHypo.AI - Métricas",

            // Step names in create-hypotheses
            uncertaintyStepTitle: "🟢 Incerteza",
            hypothesisStepTitle: "1. Hipótese",
            nfrStepTitle: "2. Requisito Não Funcional (RNF)",
            uncertaintyAssessmentTitle: "3. Avaliação de Incerteza",
            impactAssessmentTitle: "4. Avaliação de Impacto",
            cardCreatedTitle: "✅ Card criado!",

            // NFR Options text content (not just IDs)
            flexibilityText: "Flexibilidade",
            performanceText: "Desempenho",
            productivityText: "Produtividade",
            reliabilityText: "Confiabilidade",
            securityText: "Segurança",
            usabilityText: "Usabilidade",

            // Level options text content
            veryLowText: "Muito Baixo",
            lowText: "Baixo",
            mediumText: "Médio",
            highText: "Alto",
            veryHighText: "Muito Alto",

            // Messages
            confirmLeave: "As informações preenchidas serão perdidas. Deseja voltar mesmo assim?",
            createCardError: "Erro ao criar o card:",
            checkConsole: "Verifique o console para mais detalhes.",
            errorGeneratingTechnicalPlan: "Erro ao gerar plano técnico. Tente novamente.",
            unknownError: "Erro desconhecido",
            justification: "Justificativa: (clique aqui)",
            objective: "**Objetivo:**",
            description: "**Descrição:**",
            domain: "Domínio:",
            uncertainty: "Incerteza:",
            impact: "Impacto:",
            selectAtLeastOne: "Por favor, selecione pelo menos um item do plano para editar.",
            estimatedWait: "(Espera estimada: 15 segundos)",
            pattern: "**Padrão ArchHypo:**",
            tradeoff: "**Tradeoff:**",
            
            // Placeholders
            justifyChangePlaceholder: "Justifique a alteração...",
            
            // Language selector
            portugueseLabel: "🇧🇷 Português",
            englishLabel: "🇺🇸 English",
            
            // Card description labels (used in regex matching)
            nfrLevelLabel: "Requisitos Não Funcionais: ",
            uncertaintyLevelLabel: "Nível de Incerteza: ",
            impactLevelLabel: "Nível de Impacto: ",
            patternLevelLabel: "Padrão ArchHypo: ",
            planLevelLabel: "Plano Técnico: ",
            
            // Tooltips content
            uncertaintyTooltipVeryLow: "🔹 <strong>Muito Baixo:</strong> A hipótese é baseada em informações sólidas e bem preparadas. Alta confiança na análise com pouca margem de erro.",
            uncertaintyTooltipLow: "🔹 <strong>Baixo:</strong> A hipótese tem uma boa base de conhecimento. A situação é conhecida com evidências para apoiar a análise.",
            uncertaintyTooltipMedium: "🔹 <strong>Médio:</strong> A hipótese envolve algum grau de incerteza. Dados úteis existem, mas alguns pontos requerem validação ou investigação.",
            uncertaintyTooltipHigh: "🔹 <strong>Alto:</strong> A hipótese é baseada em suposições com poucas evidências concretas. A análise requer cautela e pode envolver riscos.",
            uncertaintyTooltipVeryHigh: "🔹 <strong>Muito Alto:</strong> A hipótese é altamente especulativa. Nenhum dado disponível e o cenário é desconhecido, requerendo investigação aprofundada.",
            
            impactTooltipVeryLow: "🔸 <strong>Muito Baixo:</strong> A situação é clara e bem compreendida. Há dados sólidos e experiência prévia que confirma o comportamento esperado.",
            impactTooltipLow: "🔸 <strong>Baixo:</strong> Há pouca incerteza. O problema é conhecido e existem soluções testadas ou documentadas.",
            impactTooltipMedium: "🔸 <strong>Médio:</strong> A situação é moderadamente complexa. Dados úteis existem para análise, mas alguns pontos ainda requerem validação.",
            impactTooltipHigh: "🔸 <strong>Alto:</strong> O problema é significativo e afeta áreas críticas. Poucas evidências concretas existem, e uma solução pode requerer investigação ou testes.",
            impactTooltipVeryHigh: "🔸 <strong>Muito Alto:</strong> A situação é altamente incerta. Nenhum dado disponível, e o impacto pode ser imprevisível. Requer análise aprofundada e cautela.",

            // Reclassify
            reclassifyTitle: "Reclassifique a Hipótese",
            reclassifyJustification: "Justificativa da reclassificação",
            selectOption: "Selecione...",
            save: "Salvar",
        },

        en: {
            previewTitle: "Preview",
            fillFieldsToPreview: "Fill in the fields to preview the card",
            // Main plugin
            pluginTitle: "ArchHypo.AI - Trello Power App",
            selectLanguage: "Select Language",

            //List
            col5: "DONE",
            col4: "IN PROGRESS",
            col3: "TO DO",
            col2: "TECHNICAL PLAN ITEM",
            col1: "UNCERTAINTY",

            // Card buttons
            technicalPlan: "Technical Plan",
            addUpdateMetric: "Add/Update Metric",

            // Board buttons
            archHypoMetrics: "ArchHypo Metrics",
            newUncertainty: "New Uncertainty",
            createBoardTemplate: "Create Board Template",
            context: "Context",

            // Modals
            generateTechnicalPlan: "Generate Technical Plan",

            // Error messages
            errorCardTitle: "Error getting card title!",
            errorUnexpected: "Unexpected error!",
            errorNoCards: "No cards found!",
            errorRetrievingCards: "Error retrieving cards:",
            errorProcessingCard: "Error processing card:",
            errorCreateBoardTemplate: "Failed to create board template. Check console for details.",
            errorGettingCardTitle: "Error: Unable to get card title.",
            errorProcessingBadges: "Error processing badges:",

            // Success messages
            fieldsUpdatedSuccess: "Fields added/updated successfully!",
            successCreateBoardTemplate: "Board template created successfully!",

            // Board template refresh
            refreshBoardToSeeButtons: "Refresh the Trello page to see the updated board buttons.",
            
            // Historical
            hypothesesHistorical: "Hypotheses",
            uncertaintyHistorical: "Uncertainty Assessment",
            impactHistorical: "Impact Assessment",
            impactTitle: "Impact History",
            uncertaintyTitle: "Uncertainty History",
            useHistorical: "Use History",
            ignoreHistorical: "Ignore",

            // Badge labels
            uncertaintyBadge: "Uncertainty",
            impactBadge: "Impact",
            nfrBadge: "NFR",
            archHypoPatternBadge: "ArchHypo Pattern",
            metricsToggle: "Add/Update Metrics",
            metricsSuccess: "Metrics enabled ✅",
            metricsFailed: "Metrics disabled ❌",

            // Levels
            veryLow: "Very Low",
            low: "Low",
            medium: "Medium",
            high: "High",
            veryHigh: "Very High",

            // NFR domains
            performance: "Performance",
            security: "Security",
            reliability: "Reliability",
            flexibility: "Flexibility",
            usability: "Usability",
            productivity: "Productivity",

            // Comments
            commentTechnicalPlan: "\"Technical Plan\" button only appears if card title doesn't contain \"TPI\"",
            commentMetricButton: "\"Add/Update Metric\" button always appears",

            // Hypotheses page
            createHypothesesTitle: "ArchHypo.AI - Create Hypotheses",
            step0Title: "🟢 Uncertainty",
            step1Title: "1. Hypothesis",
            step2Title: "2. Non-Functional Requirement (NFR)",
            step3Title: "3. Uncertainty Assessment",
            step4Title: "4. Impact Assessment",
            step5Title: "✅ Card created!",

            // Buttons
            next: "Next",
            previous: "Previous",
            create: "Create",
            loading: "⏳ Processing...",

            // Placeholders
            contextPlaceholder: "Describe the uncertainty, situation or context in detail...",

            // Technical Plan page
            technicalPlanTitle: "ArchHypo.AI - Technical Plan",
            techPlanStep0Title: "1. Technical Plan",
            techPlanStep1Title: "1. Edit Technical Plan",
            techPlanStep2Title: "2. ArchHypo Pattern",
            techPlanStep3Title: "✅ Technical Plan Items created!",
            generate: "Generate",
            edit: "Edit",

            // Metrics page
            metricsTitle: "ArchHypo.AI Metrics",
            uncertaintyChart: "Uncertainty",
            nfrChart: "Non-Functional Requirements (NFR)",
            patternsChart: "ArchHypo Patterns",
            precisionAt5: "Precision@5",
            hitRate: "Hit Rate",
            mrr: "MRR",
            factualConsistency: "Factual Consistency",
            relevanceScore: "Relevance Score",

            // Placeholders
            contextPlaceholder: "Describe the uncertainty, situation or context in detail...",

            // HTML page titles
            createHypothesesPageTitle: "ArchHypo.AI - Create Hypotheses",
            technicalPlanPageTitle: "ArchHypo.AI - Technical Plan",
            metricsPageTitle: "ArchHypo.AI - Metrics",

            // Step names in create-hypotheses  
            uncertaintyStepTitle: "🟢 Uncertainty",
            hypothesisStepTitle: "1. Hypothesis",
            nfrStepTitle: "2. Non-Functional Requirement (NFR)",
            uncertaintyAssessmentTitle: "3. Uncertainty Assessment",
            impactAssessmentTitle: "4. Impact Assessment",
            cardCreatedTitle: "✅ Card created!",

            // NFR Options text content (not just IDs)
            flexibilityText: "Flexibility",
            performanceText: "Performance",
            productivityText: "Productivity",
            reliabilityText: "Reliability",
            securityText: "Security",
            usabilityText: "Usability",

            // Level options text content
            veryLowText: "Very Low",
            lowText: "Low",
            mediumText: "Medium",
            highText: "High",
            veryHighText: "Very High",

            // Messages
            confirmLeave: "The filled information will be lost. Do you really want to go back?",
            createCardError: "Error creating card:",
            checkConsole: "Check console for more details.",
            errorGeneratingTechnicalPlan: "Error generating technical plan. Please try again.",
            unknownError: "Unknown error",
            justification: "Justification: (click here)",
            objective: "**Objective:**",
            description: "**Description:**",
            domain: "Domain:",
            uncertainty: "Uncertainty:",
            impact: "Impact:",
            selectAtLeastOne: "Please select at least one plan item to edit.",
            estimatedWait: "(Estimated wait: 15 seconds)",
            pattern: "**ArchHypo Pattern:**",
            tradeoff: "**Tradeoff:**",
            
            // Placeholders
            justifyChangePlaceholder: "Justify the change...",
            
            // Language selector
            portugueseLabel: "🇧🇷 Português",
            englishLabel: "🇺🇸 English",
            
            // Card description labels (used in regex matching)
            nfrLevelLabel: "Non-Functional Requirements: ",
            uncertaintyLevelLabel: "Uncertainty Level: ",
            impactLevelLabel: "Impact Level: ",
            patternLevelLabel: "ArchHypo Pattern: ",
            planLevelLabel: "Technical Plan: ",
            
            // Tooltips content
            uncertaintyTooltipVeryLow: "🔹 <strong>Very Low:</strong> The hypothesis is based on solid and well-prepared information. High confidence in analysis with little margin for error.",
            uncertaintyTooltipLow: "🔹 <strong>Low:</strong> The hypothesis has a good knowledge base. The situation is known with evidence to support the analysis.",
            uncertaintyTooltipMedium: "🔹 <strong>Medium:</strong> The hypothesis involves some degree of uncertainty. Useful data exists but some points require validation or investigation.",
            uncertaintyTooltipHigh: "🔹 <strong>High:</strong> The hypothesis is based on assumptions with few concrete evidence. Analysis requires caution and may involve risks.",
            uncertaintyTooltipVeryHigh: "🔹 <strong>Very High:</strong> The hypothesis is highly speculative. No data available and the scenario is unknown, requiring in-depth investigation.",
            
            impactTooltipVeryLow: "🔸 <strong>Very Low:</strong> The situation is clear and well understood. There is solid data and previous experience that confirms expected behavior.",
            impactTooltipLow: "🔸 <strong>Low:</strong> There is little uncertainty. The problem is known and tested or documented solutions exist.",
            impactTooltipMedium: "🔸 <strong>Medium:</strong> The situation is moderately complex. Useful data exists for analysis, but some points still require validation.",
            impactTooltipHigh: "🔸 <strong>High:</strong> The problem is significant and affects critical areas. Few concrete evidence exists, and a solution may require investigation or testing.",
            impactTooltipVeryHigh: "🔸 <strong>Very High:</strong> The situation is highly uncertain. No data available, and impact may be unpredictable. Requires in-depth analysis and caution.",

            // Reclassify
            reclassifyTitle: "Reclassify Hyphoteses",
            reclassifyJustification: "Justification for reclassification",
            selectOption: "Select...",
            save: "Save",
        }
    },

    currentLanguage: 'pt', // Default language

    // Initialize with language detection from URL or localStorage
    init: function () {
        // Try to get language from URL params first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');

        if (urlLang && this.translations[urlLang]) {
            this.currentLanguage = urlLang;
        } else {
            // Try localStorage
            const savedLang = localStorage.getItem('archHypoLanguage');
            if (savedLang && this.translations[savedLang]) {
                this.currentLanguage = savedLang;
            } else {
                // Try browser language
                const browserLang = navigator.language?.substring(0, 2);
                if (browserLang && this.translations[browserLang]) {
                    this.currentLanguage = browserLang;
                }
            }
        }

        // Save to localStorage
        localStorage.setItem('archHypoLanguage', this.currentLanguage);
    },

    // Get translated text
    t: function (key) {
        return this.translations[this.currentLanguage]?.[key] || this.translations['pt'][key] || key;
    },

    // Set language
    setLanguage: function (lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('archHypoLanguage', lang);
        }
    },

    // Get current language
    getCurrentLanguage: function () {
        return this.currentLanguage;
    },

    // Level translation mappings
    getLevelMapping: function () {
        if (this.currentLanguage === 'en') {
            return {
                "Muito Baixo": "Very Low",
                "Baixo": "Low",
                "Médio": "Medium",
                "Alto": "High",
                "Muito Alto": "Very High"
            };
        }
        return {}; // No mapping needed for Portuguese
    },

    // NFR domain translation mappings
    get nfrMap() {
        if (this.currentLanguage === 'en') {
            return {
                "Desempenho": "Performance",
                "Segurança": "Security",
                "Confiabilidade": "Reliability",
                "Flexibilidade": "Flexibility",
                "Usabilidade": "Usability",
                "Productividade": "Productivity"
            };
        }
        return {}; // No mapping needed for Portuguese
    },

    getNFRMapping: function () {
        return this.nfrMap;
    },

    // Normalize level values from any language to a common key
    normalizeLevelValue: function(value) {
        if (!value) return null;
        const normalized = value.trim();
        
        // Create reverse mapping for both languages
        const levelMap = {
            // Portuguese
            'Muito Baixo': 'veryLow',
            'Baixo': 'low',
            'Médio': 'medium',
            'Alto': 'high',
            'Muito Alto': 'veryHigh',
            // English
            'Very Low': 'veryLow',
            'Low': 'low',
            'Medium': 'medium',
            'High': 'high',
            'Very High': 'veryHigh'
        };
        
        return levelMap[normalized] || null;
    },

    // Normalize NFR domain values from any language to a common key
    normalizeNFRValue: function(value) {
        if (!value) return null;
        const normalized = value.trim();
        
        const nfrMap = {
            // Portuguese
            'Desempenho': 'performance',
            'Segurança': 'security',
            'Confiabilidade': 'reliability',
            'Flexibilidade': 'flexibility',
            'Usabilidade': 'usability',
            'Productividade': 'productivity',
            // English
            'Performance': 'performance',
            'Security': 'security',
            'Reliability': 'reliability',
            'Flexibility': 'flexibility',
            'Usability': 'usability',
            'Productivity': 'productivity'
        };
        
        return nfrMap[normalized] || null;
    },

    // Get all possible level keys
    getAllLevelKeys: function() {
        return ['veryLow', 'low', 'medium', 'high', 'veryHigh'];
    },

    // Get all possible NFR keys
    getAllNFRKeys: function() {
        return ['performance', 'security', 'reliability', 'flexibility', 'usability', 'productivity'];
    }
};

// Initialize on load
I18N.init();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = I18N;
}