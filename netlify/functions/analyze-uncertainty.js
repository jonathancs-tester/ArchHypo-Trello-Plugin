import { handleCors, corsHeaders } from './utils/cors.js';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { cleanAndParseJSON } from './utils/json-utils.js';

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input, language = 'pt' } = JSON.parse(event.body);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GENAI_API_KEY,
  });

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = ChatPromptTemplate.fromTemplate(
    `Você é um Gerente de Produto Técnico (Technical Product Manager) sênior, especialista em análise de risco e validação de hipóteses. Sua tarefa é analisar o contexto fornecido em "{input}" para classificar o nível de incerteza associado.

**Contexto / Hipótese para Análise:** "{input}"

---

**Instruções de Análise:**
1.  **Analise o Contexto:** Entenda a natureza da hipótese ou situação descrita em "{input}".
2.  **Classifique a Incerteza:** Compare as evidências disponíveis com a escala de classificação abaixo e escolha o nível mais apropriado.
3.  **Justifique sua Decisão:** No campo "motivo", explique seu raciocínio, conectando diretamente as evidências (ou a falta delas) à classificação escolhida.

**Escala de Classificação de Incerteza:**
- **Muito Baixo:** A situação é bem conhecida. Temos métricas, logs ou dados quantitativos que confirmam o comportamento. Já executamos tarefas idênticas ou muito similares no passado com sucesso.
- **Baixo:** Temos uma boa base de conhecimento. Embora não tenhamos dados quantitativos perfeitos, há forte experiência interna, documentação clara ou projetos análogos que nos dão alta confiança.
- **Médio:** Existem algumas evidências, mas são incompletas. Temos dados qualitativos (ex: feedback de usuários), mas não quantitativos. A equipe tem alguma familiaridade com o domínio, mas não com a tecnologia específica.
- **Alto:** A análise é baseada principalmente em suposições. As evidências são fracas ou inexistentes. É uma tecnologia nova para a equipe ou um problema que nunca enfrentamos antes.
- **Muito Alto:** Cenário puramente especulativo ou de P&D (Pesquisa e Desenvolvimento). Não há dados, experiência interna ou precedentes de mercado claros. A solução exigirá uma prova de conceito do zero.

**Exemplo de Execução:**
- **input:** "Hipótese: Adotar um novo banco de dados NoSQL (ex: ScyllaDB) para nosso serviço de mensageria pode melhorar a escalabilidade em 10x."
- **Output Esperado (para idiomaTexto='Português'):**
  {{
    "sugestao": "Muito Alto",
    "motivo": "A incerteza é classificada como 'Muito Alto' porque a equipe não possui qualquer experiência prévia com a tecnologia proposta (ScyllaDB). A análise seria baseada apenas em documentação externa, sem dados, benchmarks ou provas de conceito internas, tornando o cenário altamente especulativo e exploratório."
  }}

---

**Regras de Saída:**
- A resposta **deve** ser um objeto JSON válido.
- O idioma de toda a resposta (chaves e valores) deve ser **exclusivamente**: ${idiomaTexto}
- O JSON deve conter apenas as chaves "sugestao" e "motivo".
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
