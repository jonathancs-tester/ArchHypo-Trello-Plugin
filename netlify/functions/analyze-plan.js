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

---

**Regras de Formatação e Saída:**
- A resposta **deve** ser um único objeto JSON válido.
- O campo "sugestao" **não deve** conter números, marcadores (`- `, ` * `) ou qualquer prefixo no início de cada item.
- Use **exclusivamente** a string '\\n' para separar os itens do campo "sugestao".
- O idioma de toda a resposta (chaves e valores) deve ser: ${idiomaTexto}
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
