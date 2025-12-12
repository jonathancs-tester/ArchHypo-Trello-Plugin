import { handleCors, corsHeaders } from './utils/cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { cleanAndParseJSON } from './utils/json-utils.js';

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input, language = 'pt' } = JSON.parse(event.body);

  const model = new ChatGoogleGenerativeAI({
    model: "gemma-3-4b",
    apiKey: process.env.GENAI_API_KEY,
  });

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = ChatPromptTemplate.fromTemplate(
    `Você é um especialista em engenharia de software e análise de sistemas. Sua tarefa é analisar a solicitação do usuário fornecida em "{input}", classificar o problema central em um dos domínios definidos abaixo e fornecer uma justificativa técnica e concisa para sua escolha.

**Domínios e Suas Definições:**
- **Desempenho:** Refere-se a problemas de velocidade, latência, tempo de resposta, uso de CPU, consumo de memória ou eficiência de algoritmos.
- **Segurança:** Relacionado a vulnerabilidades, proteção de dados, autenticação, autorização, criptografia ou qualquer falha que possa ser explorada.
- **Confiabilidade:** Focado em bugs, erros inesperados (exceptions), falhas, crashes, consistência de dados, disponibilidade do sistema (uptime) e resiliência.
- **Flexibilidade:** Trata da capacidade de estender, modificar ou manter o código. Inclui temas como acoplamento, coesão, escalabilidade da arquitetura e manutenibilidade.
- **Usabilidade:** Pertence à experiência do usuário (UX). Envolve dificuldades na interface (UI), fluxos de trabalho confusos, design pouco intuitivo ou barreiras para o usuário atingir seu objetivo.
- **Produtividade:** Relacionado à eficiência da equipe de desenvolvimento. Cobre automação de tarefas, ferramentas (tooling), processos de build/deploy e otimização do fluxo de trabalho do desenvolvedor.

**Instruções:**
1.  Analise cuidadosamente o texto em "{input}".
2.  Identifique o problema principal descrito.
3.  Escolha o domínio que **melhor representa** a raiz do problema, com base nas definições fornecidas.
4.  Elabore uma justificativa curta (1-2 frases) explicando por que o problema se encaixa nesse domínio.

**Regras de Saída:**
- A resposta **deve** ser um objeto JSON válido.
- O idioma de toda a resposta (chaves e valores do JSON) deve ser **exclusivamente**: ${idiomaTexto}
- O JSON deve ter exatamente as seguintes chaves: "sugestao" e "motivo".

**Exemplo de Input:** "O login na nossa aplicação está demorando mais de 5 segundos para completar depois que o usuário clica no botão."
**Exemplo de Output (para idiomaTexto='Português'):**
{{"sugestao": "Desempenho", "motivo": "A descrição foca diretamente na lentidão e no tempo de resposta excessivo de uma funcionalidade, que são indicadores clássicos de um problema de desempenho."}}

---
**Input do Usuário:** "{input}"
`
  );

  const chain = prompt.pipe(model);
  const result = await chain.invoke({ input });

  // Usar a função de parse robusto
  const parsedResult = cleanAndParseJSON(result.content);
  const { sugestao, motivo } = parsedResult;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ sugestao, motivo }),
  };
}
