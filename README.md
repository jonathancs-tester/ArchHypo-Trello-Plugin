# ArchHypo.AI 
Plugin para Trello que integra funcionalidades de arquitetura hipotética (ArchHypo), facilitando a gestão de hipóteses e decisões arquiteturais utilizando LLM diretamente nos cards do Trello.

## 🆕 Nova Funcionalidade: Análise Inteligente de Código

Este Power-Up agora permite conectar repositórios de código fonte (GitHub) diretamente aos cards do Trello. Um modelo de linguagem (LLM) analisa automaticamente o código e fornece recomendações sobre:

- 🏗️ **Arquitetura**: Detecta padrões arquiteturais (MVC, Clean Architecture, Microservices, etc.)
- 🎨 **Padrões de Projeto**: Identifica design patterns implementados
- ✅ **Boas Práticas**: Avalia aderência a SOLID, Clean Code, DRY, KISS
- 🔒 **Segurança**: Detecta vulnerabilidades e riscos potenciais
- ⚡ **Performance**: Identifica gargalos e oportunidades de otimização
- 📊 **Métricas**: Analisa complexidade, acoplamento e coesão

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Trello](https://img.shields.io/badge/trello-%230A0FFF.svg?style=for-the-badge&logo=trello&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white)


![Build](https://img.shields.io/badge/build-passed-brightgreen)
[![Netlify Status](https://api.netlify.com/api/v1/badges/5fe0636c-5fe3-4cdc-9c25-17b7464cf841/deploy-status?branch=main)](https://app.netlify.com/projects/archhypo/deploys)

---

# 📑 Sumário
- [🆕 Análise Inteligente de Código](#-análise-inteligente-de-código)
- [🛠️ Rodando Localmente](#️-rodando-localmente)
  - [Pré-requisitos](#-pré-requisitos)
  - [Instalação](#-instalação)
  - [Configuração](#configuração)
  - [Executando localmente](#-executando-localmente)
- [📄 Licença](#-licença)
- [🤝 Contribuição](#-contribuição)
- [📬 Contato](#-contato)

---

## 🆕 Análise Inteligente de Código

### Como usar:

1. **Abra um card** no Trello
2. **Clique no botão "Analisar Código"** que aparece nos cards
3. **Conecte-se ao GitHub** através do OAuth
4. **Selecione o repositório** que deseja analisar
5. **Escolha os arquivos** de código (até 20 arquivos)
6. **Selecione o tipo de análise**:
   - 🎯 **Análise Completa**: Arquitetura, padrões, segurança e performance
   - 🏗️ **Arquitetura**: Foco em padrões arquiteturais
   - 🎨 **Padrões de Projeto**: Identifica design patterns
   - ✅ **Boas Práticas**: SOLID, Clean Code, DRY
   - 🔒 **Segurança**: Vulnerabilidades e riscos
7. **Aguarde a análise** (processada por IA)
8. **Revise os resultados** e **salve no card** do Trello

### Tecnologias utilizadas:

- **GitHub API**: Para acesso aos repositórios
- **Google Gemini**: LLM para análise inteligente do código
- **Netlify Functions**: Serverless backend
- **Trello Power-Up API**: Integração com Trello

---

## 🛠️ Rodando Localmente

### ✅ Pré-requisitos  

- **Node.js** (versão 18 ou superior)  
- **npm ou yarn** (versão 18 ou superior)  
- **NVM** (Node Version Manager)
- **Netlify**
- **Trello Developer Credentials**
- **Gemini Developer Credentials**

### 🚀 Instalação  

Para instalar as dependências necessárias, execute:  

```sh
npm install
npm install -g netlify-cli
```

### Configuração

Crie um arquivo .env com as seguintes variáveis:
```sh
BACKEND_URL=url_backend_server
GENAI_API_KEY=llm_api_key
GENAI_URL=llm_base_url
TRELLO_API_URL=trello_base_url
TRELLO_KEY=trello_key
TRELLO_TOKEN=trello_token
PINECONE_API_KEY=pinecode_api_key
PINECONE_ENV=pinecode_endpoint
PINECONE_INDEX=pinecode_index

# Configurações para Análise de Código (GitHub OAuth)
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret
GITHUB_REDIRECT_URI=https://seu-site.netlify.app/.netlify/functions/github-callback
```

#### Como obter credenciais do GitHub OAuth:

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Preencha:
   - **Application name**: ArchHypo Code Analyzer
   - **Homepage URL**: URL do seu Netlify (ex: https://archhypo.netlify.app)
   - **Authorization callback URL**: https://seu-site.netlify.app/.netlify/functions/github-callback
4. Clique em "Register application"
5. Copie o **Client ID** e **Client Secret**
6. Adicione ao arquivo `.env`

### 🔧 Executando localmente

```sh
npx netlify dev
```
A aplicação estará disponível em http://localhost:8888.

## 📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

## 📬 Contato
Se tiver dúvidas ou sugestões, entre em contato:

📧 Email: jonathan.carvalho@unifesp.br
🔗 LinkedIn: jonathancs-qa
🐙 GitHub: jonathancs-tester
