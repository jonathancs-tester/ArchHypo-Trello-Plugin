// Igual ao de incerteza, só muda o prompt:
import { handleCors, corsHeaders } from './utils/cors.js';
import fetch from "node-fetch";
import { cleanAndParseJSON } from './utils/json-utils.js';

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input, language = 'pt' } = JSON.parse(event.body);

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = `Você é um Analista de Risco e SRE (Site Reliability Engineer) sênior. Sua tarefa é analisar uma situação descrita em "${input}" e classificar o **impacto** potencial em uma escala de cinco níveis.

**Situação para Análise:** "{input}"

---

**Instruções de Análise:**
1.  **Avalie a Situação:** Entenda qual componente, fluxo ou grupo de usuários é afetado pelo "{input}".
2.  **Use a Escala de Impacto:** Se o histórico for insuficiente ou inexistente, use as definições abaixo para classificar o impacto potencial.
3.  **Justifique sua Resposta:** No campo "motivo", explique seu raciocínio, citando o histórico quando aplicável ou a definição da escala que usou.

**Escala de Classificação de Impacto:**
- **Muito Baixo:** O efeito é mínimo, quase imperceptível. Afeta apenas processos internos ou um ambiente de testes, sem qualquer consequência para o usuário final.
- **Baixo:** Afeta um grupo muito pequeno e específico de usuários ou uma funcionalidade secundária com alternativas fáceis. O contorno é simples.
- **Médio:** Causa inconveniência ou degradação da experiência para um subconjunto de usuários. Afeta uma funcionalidade importante, mas não crítica.
- **Alto:** Causa uma interrupção significativa do serviço para muitos usuários ou afeta uma funcionalidade crítica (ex: login, busca principal). Gera frustração e perda de confiança.
- **Muito Alto:** Causa indisponibilidade geral do serviço (downtime), perda de dados, falha grave de segurança ou impacto financeiro direto.

**Exemplo de Execução:**
- **input:** "Estamos planejando migrar o banco de dados de usuários para um novo cluster."
- **Output Esperado (para idiomaTexto='Português'):**
  {{"sugestao": "Muito Alto", "motivo": "A migração afeta um componente central (banco de dados de usuários) e o histórico de migrações similares na empresa resultou em downtime significativo. Portanto, o risco de um impacto severo na disponibilidade do serviço é a principal justificativa."}}

---

**Regras de Saída:**
- A resposta **deve** ser um objeto JSON válido.
- O idioma de toda a resposta (chaves e valores) deve ser **exclusivamente**: ${idiomaTexto}
- O JSON deve conter apenas as chaves "sugestao" e "motivo".
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GENAI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    }
  );

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Usar a função de parse robusto
  const parsedResult = cleanAndParseJSON(rawContent);
  const { sugestao, motivo } = parsedResult;

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ sugestao, motivo }),
  };
}
