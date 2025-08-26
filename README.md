# ArchHypo.AI 
Plugin para Trello que integra funcionalidades de arquitetura hipotética (ArchHypo), facilitando a gestão de hipóteses e decisões arquiteturais utilizando LLM diretamente nos cards do Trello.

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Trello](https://img.shields.io/badge/trello-%230A0FFF.svg?style=for-the-badge&logo=trello&logoColor=white)
![Git](https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white)
[![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)


![Build](https://img.shields.io/badge/build-passed-brightgreen)

---

# 📑 Sumário
- [📖 User Guide](#-user-guide)
  - [Funcionalidades Principais](#funcionalidades-principais)
    - [Criação de Hipóteses Arquiteturais](#criação-de-hipóteses-arquiteturais)
    - [Classificação e Priorização](#classificação-e-priorização)
    - [Histórico de Decisões](#histórico-de-decisões)
    - [Integração com Labels e Checklists](#integração-com-labels-e-checklists)
  - [Como Usar](#como-usar)
- [🛠️ Rodando Localmente](#️-rodando-localmente)
  - [Pré-requisitos](#-pré-requisitos)
  - [Instalação](#-instalação)
  - [Configuração](#configuração)
  - [Executando localmente](#-executando-localmente)
- [📄 Licença](#-licença)
- [🤝 Contribuição](#-contribuição)
- [📬 Contato](#-contato)

---

## 📖 User Guide

### 🔑 Principais Ações

#### 🗂️ Criar um Board Template  
Adicione hipóteses diretamente aos cards do Trello com campos personalizados para iniciar seu fluxo de trabalho.

#### ❓ Criar uma Incerteza  
Ao registrar uma **Incerteza**, o LLM sugere uma **Hipótese** e sua classificação (pode ser ajustada pelo usuário).

#### 📋 Criar Plano Técnico  
Com base em uma **Hipótese**, o LLM sugere **itens do plano técnico** e padrões relacionados (ArchHypo Patterns).

#### 🏷️ Add/Atualizar Métricas  
Use **labels** para categorizar:  
- Hipóteses → *Nível de Incerteza, Impacto e Requisito Não Funcional*  
- Itens do Plano Técnico → *Padrões ArchHypo*  

#### 📊 ArchHypo Métricas  
Visualize **3 gráficos** que ajudam a gerenciar as métricas e labels de categorização de Hipóteses e Itens de Plano Técnico.

---

### 🚀 Como Usar (Passo a Passo)

1. **Adicionar Power Up** → Adicione o **ArchHypo.AI** no seu board do Trello.  
2. **Criar Board Template** → Clique em *"Criar um Board Template"* para começar.  
3. **Criar Incerteza** → Clique em *"Criar uma Incerteza"* e preencha as informações.  
   - 💡 O LLM sugere hipótese + motivo (você pode editar).  
4. **Adicionar Métricas** → Clique em *"Add/Atualizar Métricas"* para configurar os labels.  
5. **Gerar Plano Técnico**  
   - Abra o card da hipótese criada.  
   - Clique em *"Plano Técnico"* → *"Gerar Plano Técnico"*.  
   - Selecione os itens sugeridos para editar ou gerar padrões ArchHypo.  
   - 💡 O LLM sugere informações + justificativas (editáveis).  
6. **Gerenciar Itens do Plano Técnico**  
   - Os itens são adicionados na coluna **ITEMS PLANO TÉCNICO**, com IDs no formato:  
     - `H1` → Hipótese 1  
     - `TPI1` → Tech Plan Item 1  
7. **Visualizar Métricas** → Use *ArchHypo Métricas* para acompanhar evolução em gráficos.  

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