# Guia de Configuração - Análise de Código

Este guia detalha como configurar a funcionalidade de análise inteligente de código do ArchHypo.AI.

## 📋 Pré-requisitos

1. Conta no GitHub
2. Aplicação Netlify configurada
3. Google Gemini API Key

## 🔧 Configuração do GitHub OAuth

### Passo 1: Criar GitHub OAuth App

1. Acesse: https://github.com/settings/developers
2. Clique em **"New OAuth App"**
3. Preencha os campos:
   - **Application name**: `ArchHypo Code Analyzer`
   - **Homepage URL**: `https://seu-site.netlify.app`
   - **Application description**: `AI-powered code analysis for Trello`
   - **Authorization callback URL**: `https://seu-site.netlify.app/.netlify/functions/github-callback`
4. Clique em **"Register application"**

### Passo 2: Obter Credenciais

1. Após criar, você verá o **Client ID**
2. Clique em **"Generate a new client secret"**
3. **Copie imediatamente** o Client Secret (ele não será mostrado novamente)

### Passo 3: Adicionar às Variáveis de Ambiente

#### Desenvolvimento Local (.env)

```bash
GITHUB_CLIENT_ID=seu_client_id_aqui
GITHUB_CLIENT_SECRET=seu_client_secret_aqui
GITHUB_REDIRECT_URI=http://localhost:8888/.netlify/functions/github-callback
```

#### Produção (Netlify)

1. Acesse seu site no Netlify Dashboard
2. Vá em **Site settings > Environment variables**
3. Adicione as variáveis:
   - `GITHUB_CLIENT_ID`: seu Client ID
   - `GITHUB_CLIENT_SECRET`: seu Client Secret
   - `GITHUB_REDIRECT_URI`: https://seu-site.netlify.app/.netlify/functions/github-callback

## 🚀 Testando a Funcionalidade

### 1. Desenvolvimento Local

```bash
# Inicie o servidor de desenvolvimento
npx netlify dev

# Acesse http://localhost:8888
```

### 2. Testar OAuth Flow

1. Abra um card no Trello
2. Clique em **"Analisar Código"**
3. Clique em **"Conectar ao GitHub"**
4. Você será redirecionado para autorizar a aplicação
5. Após autorizar, retornará para a página de análise

### 3. Realizar uma Análise

1. Selecione um repositório da lista
2. Escolha os arquivos (máximo 20)
3. Selecione o tipo de análise
4. Clique em **"Iniciar Análise"**
5. Aguarde o processamento (15-30 segundos)
6. Revise os resultados
7. Salve no card do Trello

## 📊 Tipos de Análise Disponíveis

### 🎯 Análise Completa
Análise abrangente incluindo:
- Arquitetura e estrutura
- Padrões de projeto
- Boas práticas de código
- Vulnerabilidades de segurança
- Otimizações de performance
- Métricas de qualidade

### 🏗️ Arquitetura
Foco em:
- Padrões arquiteturais (MVC, Clean, Microservices)
- Separação de responsabilidades
- Camadas e módulos
- Sugestões de reestruturação

### 🎨 Padrões de Projeto
Identifica:
- Design patterns implementados
- Oportunidades para aplicar patterns
- Problemas de implementação

### ✅ Boas Práticas
Avalia:
- Princípios SOLID
- Clean Code
- DRY, KISS, YAGNI
- Code smells

### 🔒 Segurança
Detecta:
- Vulnerabilidades conhecidas
- SQL Injection, XSS
- Secrets hardcoded
- Dependências desatualizadas

## 🔍 Interpretando os Resultados

### Níveis de Qualidade
- **Excelente** 🟢: Código bem estruturado, sem problemas significativos
- **Boa** 🔵: Código sólido com pequenas oportunidades de melhoria
- **Regular** 🟡: Código funcional mas com pontos de atenção
- **Precisa Melhorias** 🔴: Código com problemas que devem ser endereçados

### Prioridades de Melhorias
- **Alta** 🔴: Impacto significativo, abordar imediatamente
- **Média** 🟡: Importante, planejar para próximas sprints
- **Baixa** 🔵: Melhorias incrementais, nice to have

### Severidade de Segurança
- **Crítica** ⚫: Vulnerabilidade grave, corrigir urgentemente
- **Alta** 🔴: Risco significativo, priorizar correção
- **Média** 🟡: Risco moderado, incluir no backlog
- **Baixa** 🔵: Risco mínimo, considerar se possível

## 🐛 Troubleshooting

### Erro: "GitHub Client ID não configurado"
- Verifique se `GITHUB_CLIENT_ID` está no arquivo `.env`
- No Netlify, confirme que a variável está nas Environment Variables

### Erro: "Erro ao obter token"
- Verifique se `GITHUB_CLIENT_SECRET` está correto
- Confirme que a `GITHUB_REDIRECT_URI` corresponde exatamente à configurada no GitHub

### Análise muito lenta ou timeout
- Reduza o número de arquivos selecionados
- Escolha apenas arquivos principais (evite arquivos gerados)
- Tente análise focada ao invés de completa

### Resultado em formato bruto (não JSON)
- Isso pode acontecer ocasionalmente com o LLM
- O resultado bruto ainda contém informações úteis
- Tente novamente ou ajuste os arquivos selecionados

## 💡 Melhores Práticas

### Seleção de Arquivos
✅ **Recomendado**:
- Arquivos principais da aplicação
- Controllers, Services, Models
- Arquivos de configuração importantes
- Código crítico de negócio

❌ **Evitar**:
- node_modules, vendor
- Arquivos compilados/gerados
- Bibliotecas de terceiros
- Arquivos muito grandes (>5000 linhas)

### Frequência de Análise
- **Inicial**: Ao iniciar projeto ou receber novo código
- **Periódica**: A cada sprint ou release
- **Ad-hoc**: Antes de code reviews importantes
- **Pré-produção**: Antes de deploy para produção

## 📚 Recursos Adicionais

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Google Gemini API](https://ai.google.dev/docs)
- [Trello Power-Up API](https://developer.atlassian.com/cloud/trello/power-ups/)

## 🆘 Suporte

Problemas ou dúvidas? Entre em contato:
- 📧 Email: jonathan.carvalho@unifesp.br
- 🐙 GitHub Issues: [Criar issue](https://github.com/jonathancs-tester/ArchHypo-Trello-Plugin/issues)
