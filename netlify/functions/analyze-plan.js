import { handleCors, corsHeaders } from './utils/cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { cleanAndParseJSON } from './utils/json-utils.js';

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input, language = 'pt' } = JSON.parse(event.body);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-lite",
    apiKey: process.env.GENAI_API_KEY,
  });

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = ChatPromptTemplate.fromTemplate(
    `Você é um(a) Arquiteto(a) de Soluções Sênior. Sua tarefa é analisar o problema descrito em "{input}" e gerar uma resposta JSON estruturada contendo um plano de ação técnico e suas razões.

**Problema / Hipótese para Análise:** "{input}"

---

**Instruções e Definições das Chaves JSON:**
1.  **Analise o Problema:** Compreenda a causa raiz e o impacto do problema descrito em "{input}".
2.  **Crie um Plano de Ação (sugestao):** Elabore de 3 a 5 ações técnicas concretas. Siga a regra de formatação à risca (separado por '\\n', sem marcadores).
3.  **Defina o Problema Central (motivo):** Descreva o "porquê" deste plano ser necessário. Fale sobre o problema atual, a dor ou a causa raiz que o justifica. Responda à pergunta: "Qual problema estamos resolvendo?".
4.  **Defina o Objetivo Futuro (justificativa):** Descreva o resultado esperado ou o estado futuro desejado após a execução do plano. Responda à pergunta: "Onde queremos chegar?".
5.  **Resuma a Abordagem (descricao):** Faça um resumo em prosa da estratégia geral do plano de ação. Explique "como" as ações listadas na "sugestao" se conectam para resolver o problema.
6.  **Analise os Riscos (tradeoff):** Liste as concessões, riscos ou pontos de observação relacionados à implementação do plano.

**Exemplo de Execução:**
- **input:** "Nossa API de pagamentos está com picos de latência de até 2 segundos em horários de alta demanda, causando timeouts no frontend."
- **Output Esperado (para idiomaTexto='Português'):**
  {{
    "sugestao": "Implementar um cache de nível de aplicação (Redis) para dados de produtos frequentemente acessados\\nOtimizar a consulta principal ao banco de dados, adicionando um índice composto na tabela de transações\\nIntroduzir uma fila de processamento assíncrono (RabbitMQ) para as notificações de pagamento pós-compra",
    "motivo": "A latência da API de pagamentos está excedendo os SLAs (Service Level Agreements) durante os horários de pico, resultando em falhas de transação e impactando negativamente a experiência do usuário e a receita.",
    "justificativa": "O objetivo é reduzir a latência p99 da API para menos de 500ms, restaurando a confiabilidade do serviço e garantindo que o fluxo de checkout suporte o crescimento projetado da demanda.",
    "descricao": "O plano propõe uma estratégia de otimização em múltiplas frentes: aliviar a carga no banco de dados com cache, melhorar a eficiência das consultas mais lentas e desacoplar processos não essenciais, como notificações, para serem executados de forma assíncrona.",
    "tradeoff": "A introdução do Redis aumenta a complexidade da infraestrutura e exige uma estratégia de invalidação de cache. O processamento assíncrono de notificações pode gerar um leve atraso na comunicação com o usuário."
  }}

---

**Regras de Saída:**
- A resposta **deve** ser um objeto JSON válido.
- O idioma de toda a resposta (chaves e valores) deve ser **exclusivamente**: ${idiomaTexto}
`
  );

  const chain = prompt.pipe(model);
  const result = await chain.invoke({ input });

  // Usar a função de parse robusto sem fallback para detectar erros
  const parsedResult = cleanAndParseJSON(result.content);

  // Verificar se o parsing foi bem-sucedido
  if (!parsedResult || !parsedResult.sugestao || parsedResult.sugestao.includes("Erro ao processar")) {
    console.error("❌ Falha na geração do plano técnico:", result.content.substring(0, 200));

    return {
      statusCode: 422, // Unprocessable Entity
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Falha na geração do plano técnico",
        message: "A IA não conseguiu processar o contexto fornecido. Tente reformular ou fornecer mais detalhes.",
        retry: true
      }),
    };
  }

  const { sugestao, motivo, justificativa, descricao, tradeoff } = parsedResult;

  // Validar campos obrigatórios
  if (!sugestao || !motivo || !justificativa || !descricao) {
    console.error("❌ Resposta da IA incompleta:", parsedResult);

    return {
      statusCode: 422,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Resposta incompleta da IA",
        message: "Nem todos os campos necessários foram gerados. Tente novamente.",
        retry: true
      }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ sugestao, motivo, justificativa, descricao, tradeoff }),
  };
}
