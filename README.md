# ArchHypo.AI 
Plugin para Trello que integra funcionalidades de arquitetura hipotética (ArchHypo), facilitando a gestão de hipóteses e decisões arquiteturais utilizando LLM diretamente nos cards do Trello.

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Trello](https://img.shields.io/badge/trello-%230A0FFF.svg?style=for-the-badge&logo=trello&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](passed)

# Sumário
- [User Guide](#UserGuide)
- [Rodando Localmente](#RodandoLocalmente)
- [Licença](#Licença)
- [Contribuição](#Contribuição)
- [Contato](#Contato)

## 📖 User Guide

### Funcionalidades Principais

#### Criação de Hipóteses Arquiteturais
Adicione hipóteses diretamente aos cards do Trello com campos personalizados.

#### Classificação e Priorização
Atribua níveis de impacto, risco e prioridade às hipóteses.

#### Histórico de Decisões
Visualize e registre decisões tomadas com base nas hipóteses.

#### Integração com Labels e Checklists
Use labels para categorizar hipóteses e checklists para acompanhar validações.

### Como Usar
 - Instale o Plugin no seu board do Trello.
 - Abra um Card e clique em “ArchHypo”.
 - Preencha os Campos com a hipótese, contexto, impacto e risco.
 - Salve e Acompanhe o progresso diretamente no card.

## 🛠️ Rodando Localmente

### ✅ Pré-requisitos  

- **Node.js** (versão 18 ou superior)  
- **npm ou yarn** (versão 18 ou superior)  
- **NVM** (Node Version Manager)
- **Trello Developer Credentials**
- **LLM Developer Credentials**

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
NON_FUNCTIONAL=archhypo_non_functional_requirements
PATTERN=archhypo_pattern
TRELLO_API_URL=trello_base_url
TRELLO_KEY=trello_key
TRELLO_TOKEN=trello_token
```

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