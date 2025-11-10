import { handleCors, corsHeaders } from './utils/cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { cleanAndParseJSON } from './utils/json-utils.js';

/**
 * Netlify Function para analisar código do repositório usando LLM
 * Analisa arquitetura, padrões de projeto, boas práticas e sugere melhorias
 */
export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const { 
      token, 
      repository, 
      files = [], 
      language = 'pt',
      analysisType = 'full' // 'full', 'architecture', 'patterns', 'practices', 'security'
    } = JSON.parse(event.body);

    if (!token || !repository) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token e repositório são obrigatórios' })
      };
    }

    // Buscar conteúdo dos arquivos selecionados
    const fileContents = [];
    for (const file of files) {
      try {
        const response = await fetch(file.download_url || file.url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3.raw'
          }
        });

        if (response.ok) {
          const content = await response.text();
          // Limitar tamanho do arquivo para evitar tokens excessivos
          const truncatedContent = content.length > 5000 
            ? content.substring(0, 5000) + '\n\n... (arquivo truncado)'
            : content;
          
          fileContents.push({
            path: file.path,
            name: file.name,
            content: truncatedContent,
            language: file.name.split('.').pop()
          });
        }
      } catch (error) {
        console.error(`Erro ao buscar arquivo ${file.path}:`, error);
      }
    }

    if (fileContents.length === 0) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Nenhum arquivo válido para análise' })
      };
    }

    // Inicializar modelo LLM
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      apiKey: process.env.GENAI_API_KEY,
      temperature: 0.3,
    });

    const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

    // Preparar contexto dos arquivos
    const filesContext = fileContents.map(f => 
      `**Arquivo: ${f.path}**\n\`\`\`${f.language}\n${f.content}\n\`\`\``
    ).join('\n\n');

    // Definir prompt baseado no tipo de análise
    const analysisPrompts = {
      full: `Você é um arquiteto de software sênior especializado em análise de código e arquitetura de software.

**CONTEXTO DO REPOSITÓRIO:**
Repositório: ${repository}
Arquivos analisados: ${fileContents.length}

${filesContext}

**SUA MISSÃO:**
Analisar profundamente o código fornecido e gerar um relatório completo em JSON com as seguintes análises:

1. **Arquitetura Detectada**: Identifique o padrão arquitetural (MVC, Clean Architecture, Microservices, Layered, etc.)
2. **Padrões de Projeto**: Liste os design patterns identificados (Singleton, Factory, Observer, etc.)
3. **Boas Práticas**: Avalie aderência a SOLID, Clean Code, DRY, KISS
4. **Pontos de Melhoria**: Identifique code smells, duplicações, complexidade excessiva
5. **Segurança**: Detecte vulnerabilidades potenciais (SQL Injection, XSS, secrets hardcoded, etc.)
6. **Performance**: Identifique gargalos potenciais e otimizações
7. **Manutenibilidade**: Avalie legibilidade, acoplamento e coesão
8. **Recomendações**: Sugira melhorias prioritizadas por impacto

**FORMATO DE SAÍDA:**
Retorne APENAS um JSON válido no seguinte formato (em ${idiomaTexto}):
{
  "arquitetura": {
    "padrao": "nome do padrão arquitetural",
    "descricao": "descrição da arquitetura detectada",
    "qualidade": "excelente|boa|regular|precisa melhorias"
  },
  "padroes_projeto": [
    {
      "nome": "nome do padrão",
      "localizacao": "onde foi encontrado",
      "avaliacao": "bem implementado|pode melhorar|mal implementado"
    }
  ],
  "boas_praticas": {
    "solid": { "score": 0-10, "observacoes": "..." },
    "clean_code": { "score": 0-10, "observacoes": "..." },
    "dry": { "score": 0-10, "observacoes": "..." }
  },
  "melhorias": [
    {
      "prioridade": "alta|media|baixa",
      "categoria": "arquitetura|codigo|seguranca|performance",
      "descricao": "descrição da melhoria",
      "impacto": "descrição do impacto positivo",
      "localizacao": "arquivo e linha se aplicável"
    }
  ],
  "seguranca": [
    {
      "severidade": "critica|alta|media|baixa",
      "tipo": "tipo da vulnerabilidade",
      "descricao": "descrição do problema",
      "recomendacao": "como corrigir",
      "localizacao": "onde está o problema"
    }
  ],
  "metricas": {
    "complexidade": "baixa|media|alta",
    "acoplamento": "baixo|medio|alto",
    "coesao": "alta|media|baixa",
    "testabilidade": "facil|moderada|dificil"
  },
  "resumo": "resumo executivo da análise em 2-3 parágrafos"
}`,

      architecture: `Analise a arquitetura do código e retorne JSON com: arquitetura detectada, camadas identificadas, separação de responsabilidades, sugestões de melhoria arquitetural.`,
      
      patterns: `Identifique todos os padrões de projeto (design patterns) no código e retorne JSON com: padrões encontrados, implementação, casos de uso, sugestões de novos padrões aplicáveis.`,
      
      practices: `Avalie as boas práticas de código e retorne JSON com: aderência a SOLID, Clean Code, DRY, KISS, code smells identificados, sugestões de refatoração.`,
      
      security: `Realize análise de segurança do código e retorne JSON com: vulnerabilidades detectadas, riscos potenciais, secrets expostos, recomendações de segurança prioritizadas.`
    };

    const promptTemplate = ChatPromptTemplate.fromTemplate(
      analysisPrompts[analysisType] || analysisPrompts.full
    );

    const chain = promptTemplate.pipe(model);
    const result = await chain.invoke({ 
      repository,
      filesContext,
      idiomaTexto
    });

    // Parse do resultado JSON
    let analysisResult;
    try {
      analysisResult = cleanAndParseJSON(result.content);
    } catch (parseError) {
      // Se falhar o parse, retornar o texto bruto estruturado
      analysisResult = {
        raw_analysis: result.content,
        error: 'Não foi possível fazer parse do JSON, retornando análise bruta'
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        repository,
        files_analyzed: fileContents.length,
        analysis_type: analysisType,
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Erro ao analisar código:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message,
        details: 'Erro ao processar análise do código'
      })
    };
  }
}
