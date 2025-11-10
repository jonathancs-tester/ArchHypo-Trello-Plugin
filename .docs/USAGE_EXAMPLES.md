# 💡 Exemplos de Uso - Análise de Código

Este documento apresenta exemplos práticos de como usar a funcionalidade de análise de código do ArchHypo.AI.

---

## 📚 Índice
1. [Exemplo Básico - Análise Completa](#exemplo-1-análise-completa-de-projeto-nodejs)
2. [Exemplo - Foco em Segurança](#exemplo-2-análise-de-segurança)
3. [Exemplo - Revisão de Arquitetura](#exemplo-3-revisão-de-arquitetura)
4. [Exemplo - Boas Práticas](#exemplo-4-avaliação-de-boas-práticas)
5. [Interpretando Resultados](#interpretando-os-resultados)

---

## Exemplo 1: Análise Completa de Projeto Node.js

### Cenário
Você tem um projeto Express.js e quer uma avaliação geral da qualidade do código.

### Arquivos Selecionados
```
✅ src/server.js
✅ src/routes/users.js
✅ src/routes/products.js
✅ src/controllers/userController.js
✅ src/controllers/productController.js
✅ src/models/User.js
✅ src/models/Product.js
✅ src/middleware/auth.js
✅ src/utils/validation.js
✅ src/config/database.js
```

### Tipo de Análise
🎯 **Análise Completa**

### Resultado Esperado

```json
{
  "arquitetura": {
    "padrao": "MVC (Model-View-Controller) com Express.js",
    "descricao": "Aplicação web seguindo padrão MVC, com separação clara entre rotas, controllers e models. Estrutura modular e organizada.",
    "qualidade": "boa"
  },
  "padroes_projeto": [
    {
      "nome": "Middleware Pattern",
      "localizacao": "src/middleware/auth.js",
      "avaliacao": "bem implementado"
    },
    {
      "nome": "Router Pattern",
      "localizacao": "src/routes/*.js",
      "avaliacao": "bem implementado"
    }
  ],
  "boas_praticas": {
    "solid": {
      "score": 7,
      "observacoes": "Controllers têm responsabilidade única. Sugestão: extrair lógica de negócio para Services."
    },
    "clean_code": {
      "score": 8,
      "observacoes": "Nomes descritivos, funções pequenas. Melhorar comentários em lógicas complexas."
    },
    "dry": {
      "score": 6,
      "observacoes": "Duplicação detectada em validações. Considere criar validators reutilizáveis."
    }
  },
  "melhorias": [
    {
      "prioridade": "alta",
      "categoria": "arquitetura",
      "descricao": "Adicionar camada de Service entre Controllers e Models",
      "impacto": "Melhora testabilidade e separa regras de negócio da camada HTTP",
      "localizacao": "src/controllers/"
    },
    {
      "prioridade": "média",
      "categoria": "codigo",
      "descricao": "Centralizar validações em um módulo reutilizável",
      "impacto": "Reduz duplicação e facilita manutenção",
      "localizacao": "src/controllers/ e src/utils/validation.js"
    }
  ],
  "seguranca": [
    {
      "severidade": "alta",
      "tipo": "Secrets Hardcoded",
      "descricao": "Credenciais de banco de dados encontradas diretamente no código",
      "recomendacao": "Mover para variáveis de ambiente (.env)",
      "localizacao": "src/config/database.js:12"
    }
  ],
  "metricas": {
    "complexidade": "media",
    "acoplamento": "baixo",
    "coesao": "alta",
    "testabilidade": "moderada"
  },
  "resumo": "Projeto bem estruturado seguindo padrão MVC. A arquitetura é clara e modular. Principais pontos de atenção: adicionar camada de serviços, remover secrets hardcoded e reduzir duplicação em validações. No geral, código de boa qualidade com espaço para melhorias incrementais."
}
```

### Como Usar no Trello
1. Crie um card: "Refatoração Backend - Q4 2024"
2. Clique em "Analisar Código"
3. Selecione o repositório
4. Escolha os 10 arquivos principais
5. Selecione "Análise Completa"
6. Salve os resultados no card
7. Use as melhorias como checklist

---

## Exemplo 2: Análise de Segurança

### Cenário
Antes de fazer deploy em produção, você quer verificar vulnerabilidades.

### Arquivos Selecionados
```
✅ src/auth/login.js
✅ src/auth/register.js
✅ src/middleware/cors.js
✅ src/middleware/sanitize.js
✅ src/database/queries.js
✅ src/api/payment.js
✅ src/config/secrets.js
```

### Tipo de Análise
🔒 **Segurança**

### Resultado Esperado

```json
{
  "seguranca": [
    {
      "severidade": "critica",
      "tipo": "SQL Injection",
      "descricao": "Query SQL construída com concatenação de strings sem sanitização",
      "recomendacao": "Usar prepared statements ou ORM (ex: Sequelize, TypeORM)",
      "localizacao": "src/database/queries.js:45-48"
    },
    {
      "severidade": "alta",
      "tipo": "Password Storage",
      "descricao": "Senhas armazenadas sem hash adequado",
      "recomendacao": "Implementar bcrypt com salt rounds >= 10",
      "localizacao": "src/auth/register.js:32"
    },
    {
      "severidade": "alta",
      "tipo": "CORS Misconfiguration",
      "descricao": "CORS configurado para aceitar qualquer origem (*)",
      "recomendacao": "Restringir origens permitidas a domínios específicos",
      "localizacao": "src/middleware/cors.js:8"
    },
    {
      "severidade": "media",
      "tipo": "JWT Secret",
      "descricao": "Secret JWT hardcoded no código",
      "recomendacao": "Mover para variável de ambiente, usar secret complexo",
      "localizacao": "src/config/secrets.js:3"
    },
    {
      "severidade": "media",
      "tipo": "Rate Limiting",
      "descricao": "Endpoint de login sem rate limiting",
      "recomendacao": "Implementar express-rate-limit para prevenir brute force",
      "localizacao": "src/auth/login.js"
    },
    {
      "severidade": "baixa",
      "tipo": "Error Exposure",
      "descricao": "Stack traces expostos em respostas de erro",
      "recomendacao": "Sanitizar erros em produção, logar detalhes apenas no servidor",
      "localizacao": "src/middleware/errorHandler.js:15"
    }
  ],
  "resumo": "Identificadas 6 questões de segurança, sendo 1 crítica e 2 de alta severidade. Priorizar correção de SQL Injection e implementação de bcrypt antes do deploy. Revisar configurações de CORS e implementar rate limiting para endpoints sensíveis."
}
```

### Plano de Ação
1. **Imediato** (Antes do Deploy):
   - ❌ BLOQUEAR: Corrigir SQL Injection
   - ❌ BLOQUEAR: Implementar bcrypt
   
2. **Urgente** (Esta Sprint):
   - ⚠️ Corrigir CORS
   - ⚠️ Mover JWT secret para .env
   
3. **Importante** (Próxima Sprint):
   - 🔜 Adicionar rate limiting
   - 🔜 Sanitizar error messages

---

## Exemplo 3: Revisão de Arquitetura

### Cenário
Projeto cresceu e você quer avaliar se a arquitetura está adequada.

### Arquivos Selecionados
```
✅ src/app.js
✅ src/core/Application.js
✅ src/modules/users/UserModule.js
✅ src/modules/orders/OrderModule.js
✅ src/shared/database/Connection.js
✅ src/shared/events/EventBus.js
✅ src/shared/cache/RedisCache.js
```

### Tipo de Análise
🏗️ **Arquitetura**

### Resultado Esperado

```json
{
  "arquitetura": {
    "padrao": "Modular Monolith com Event-Driven Architecture",
    "descricao": "Aplicação organizada em módulos independentes que se comunicam via EventBus. Cada módulo tem suas próprias responsabilidades e dependências. Camada compartilhada (shared) fornece infraestrutura comum.",
    "qualidade": "excelente"
  },
  "camadas": [
    {
      "nome": "Modules Layer",
      "descricao": "Módulos de domínio (Users, Orders) com baixo acoplamento",
      "avaliacao": "bem estruturada"
    },
    {
      "nome": "Shared Layer",
      "descricao": "Infraestrutura compartilhada (database, events, cache)",
      "avaliacao": "bem estruturada"
    },
    {
      "nome": "Core Layer",
      "descricao": "Bootstrapping e configuração da aplicação",
      "avaliacao": "bem estruturada"
    }
  ],
  "pontos_fortes": [
    "Separação clara de responsabilidades entre módulos",
    "Baixo acoplamento através de eventos",
    "Camada compartilhada reutilizável",
    "Facilita testes unitários por módulo"
  ],
  "sugestoes": [
    {
      "prioridade": "media",
      "descricao": "Adicionar Domain-Driven Design (DDD) dentro dos módulos",
      "beneficio": "Melhor organização de regras de negócio complexas",
      "esforco": "médio"
    },
    {
      "prioridade": "baixa",
      "descricao": "Considerar CQRS para módulo de Orders",
      "beneficio": "Melhor performance em leituras, separação read/write",
      "esforco": "alto"
    }
  ],
  "preparacao_microservicos": {
    "viabilidade": "alta",
    "comentario": "Módulos já são independentes. Migração para microserviços seria relativamente simples substituindo EventBus por message broker (RabbitMQ/Kafka)."
  }
}
```

### Insights para o Time
- ✅ **Arquitetura saudável** para crescimento
- ✅ **Pronta para escala** se necessário
- 💡 Considerar DDD para complexidade futura
- 🚀 Possível migração para microserviços sem refactoring massivo

---

## Exemplo 4: Avaliação de Boas Práticas

### Cenário
Code review de PR grande, quer verificar se segue padrões do time.

### Arquivos Selecionados
```
✅ src/services/PaymentService.js
✅ src/services/NotificationService.js
✅ src/utils/helpers.js
✅ src/utils/formatters.js
✅ tests/services/PaymentService.test.js
```

### Tipo de Análise
✅ **Boas Práticas**

### Resultado Esperado

```json
{
  "boas_praticas": {
    "solid": {
      "score": 8,
      "observacoes": "Single Responsibility: ✅ Bem aplicado. Dependency Inversion: ✅ Services recebem dependências. Open/Closed: ⚠️ PaymentService tem muitos if/else, dificulta extensão."
    },
    "clean_code": {
      "score": 7,
      "observacoes": "Nomes descritivos: ✅. Funções pequenas: ⚠️ PaymentService.process() tem 150 linhas. Comentários: ⚠️ Faltam JSDoc."
    },
    "dry": {
      "score": 9,
      "observacoes": "Pouca duplicação. Helpers e formatters reutilizáveis. Boa abstração."
    },
    "kiss": {
      "score": 6,
      "observacoes": "helpers.js tem funções over-engineered. Preferir soluções simples."
    },
    "yagni": {
      "score": 7,
      "observacoes": "Alguns métodos em helpers.js não são usados. Remover código não utilizado."
    }
  },
  "code_smells": [
    {
      "tipo": "Long Method",
      "localizacao": "PaymentService.js:45-195",
      "sugestao": "Quebrar em métodos menores: validatePayment(), processTransaction(), sendNotification()"
    },
    {
      "tipo": "Feature Envy",
      "localizacao": "NotificationService.js:30",
      "sugestao": "Método acessa muito o objeto User. Considerar mover lógica para User class."
    },
    {
      "tipo": "Dead Code",
      "localizacao": "helpers.js:120-145",
      "sugestao": "Função calculateDiscount() não é usada. Remover ou documentar intenção futura."
    }
  ],
  "sugestoes_refatoracao": [
    {
      "prioridade": "alta",
      "item": "Refatorar PaymentService.process()",
      "tecnica": "Extract Method",
      "impacto": "Melhora legibilidade e testabilidade"
    },
    {
      "prioridade": "media",
      "item": "Adicionar JSDoc em todos os services",
      "tecnica": "Documentation",
      "impacto": "Facilita onboarding e uso da API"
    },
    {
      "prioridade": "baixa",
      "item": "Simplificar helpers.js",
      "tecnica": "Simplify",
      "impacto": "Reduz complexidade cognitiva"
    }
  ],
  "testes": {
    "cobertura_estimada": "65%",
    "qualidade": "boa",
    "sugestoes": [
      "Adicionar testes para edge cases em PaymentService",
      "Mockar dependências externas (NotificationService)",
      "Adicionar testes de integração"
    ]
  }
}
```

### Feedback para o Desenvolvedor
```markdown
## Code Review - PR #123

### 👍 Pontos Positivos
- Boa separação de responsabilidades
- Helpers reutilizáveis
- Testes presentes

### 🔧 Sugestões de Melhoria

#### Alta Prioridade
- [ ] Refatorar `PaymentService.process()` (muito longo - 150 linhas)
  - Sugestão: quebrar em `validatePayment()`, `processTransaction()`, `sendNotification()`

#### Média Prioridade
- [ ] Adicionar JSDoc nos métodos públicos
- [ ] Remover código não utilizado em `helpers.js`

#### Baixa Prioridade
- [ ] Simplificar over-engineering em alguns helpers

### 📊 Métricas
- SOLID: 8/10
- Clean Code: 7/10
- DRY: 9/10

### ✅ Aprovação
PR aprovado com sugestões. Implementar melhorias de alta prioridade antes do merge.
```

---

## Interpretando os Resultados

### 🎨 Códigos de Cores

#### Qualidade de Arquitetura
- 🟢 **Excelente**: Arquitetura bem pensada, escalável, manutenível
- 🔵 **Boa**: Sólida com pequenas oportunidades de melhoria
- 🟡 **Regular**: Funcional mas com debitos técnicos
- 🔴 **Precisa Melhorias**: Requer refatoração significativa

#### Prioridade de Melhorias
- 🔴 **Alta**: Impacto significativo, abordar imediatamente
- 🟡 **Média**: Importante, planejar para próximas sprints
- 🔵 **Baixa**: Nice to have, backlog

#### Severidade de Segurança
- ⚫ **Crítica**: Vulnerabilidade grave, BLOQUEAR deploy
- 🔴 **Alta**: Risco significativo, corrigir urgentemente
- 🟡 **Média**: Risco moderado, incluir no backlog
- 🔵 **Baixa**: Risco mínimo, considerar quando possível

### 📊 Scores (0-10)

| Score | Interpretação | Ação |
|-------|---------------|------|
| 9-10 | Excelente | Manter padrão |
| 7-8 | Bom | Pequenos ajustes |
| 5-6 | Regular | Melhorias necessárias |
| 3-4 | Ruim | Refatoração importante |
| 0-2 | Crítico | Reescrita recomendada |

---

## 💡 Dicas de Uso

### ✅ Fazer
- Analisar código antes de code reviews
- Usar em onboarding de novos devs
- Criar baseline de qualidade
- Documentar decisões arquiteturais
- Priorizar débito técnico

### ❌ Evitar
- Analisar apenas código gerado (node_modules, dist)
- Selecionar muitos arquivos (>20)
- Ignorar completamente sugestões da IA
- Usar como única fonte de verdade
- Substituir code review humano

### 🎯 Melhores Práticas
1. **Combine com revisão humana**: IA é ferramenta, não substituto
2. **Documente decisões**: Salve análises importantes no Trello
3. **Crie padrões**: Use como base para guidelines do time
4. **Itere**: Analise periodicamente para medir progresso
5. **Seja crítico**: Avalie sugestões da IA com senso crítico

---

## 📞 Precisa de Ajuda?

**Documentação**: Ver `CODE_ANALYSIS_SETUP.md`  
**Suporte**: jonathan.carvalho@unifesp.br  
**Issues**: GitHub Issues

---

**Última atualização**: Novembro 2025
