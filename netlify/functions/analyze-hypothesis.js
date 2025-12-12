import { handleCors, corsHeaders } from './utils/cors.js';
import fetch from "node-fetch";
import { cleanAndParseJSON } from './utils/json-utils.js';

export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  const { input, language = 'pt' } = JSON.parse(event.body);

  // Usar idioma enviado pelo frontend em vez de detecção automática
  const idiomaTexto = language === 'pt' ? 'português' : 'inglês';

  const prompt = `Você é um Agile Coach experiente, especialista em transformar incertezas de produto e engenharia em hipóteses claras e acionáveis. Sua tarefa é analisar o contexto de uma incerteza fornecida em "${input}" e gerar uma hipótese para validá-la, junto com o motivo pelo qual essa validação é importante.

**Definição dos Conceitos:**
- **Incerteza (Input):** Uma situação, problema ou ideia cujo impacto ou resultado é desconhecido.
- **Hipótese (sugestao):** Uma declaração clara e testável que propõe uma ação ou investigação para reduzir a incerteza. Geralmente segue o formato: "Acreditamos que [fazer uma ação] irá resultar em [um resultado esperado]".
- **Motivo (motivo):** A justificativa estratégica ou técnica. Explica por que é crucial testar a hipótese, destacando o risco a ser mitigado ou o valor a ser capturado.

**Instruções de Raciocínio:**
1.  Leia a incerteza em "${input}".
2.  Identifique o principal risco ou a questão a ser respondida.
3.  Formule uma hipótese clara e acionável para testar essa questão.
4.  Defina o motivo principal pelo qual testar essa hipótese agrega valor (ex: mitigar um risco, validar uma oportunidade, evitar retrabalho).
5.  Estruture a resposta final em JSON.

**Regras de Saída:**
- A resposta **deve** ser um objeto JSON válido e nada mais.
- O idioma de toda a resposta (chaves e valores) deve ser **exclusivamente**: ${idiomaTexto}
- O JSON deve conter apenas as chaves "sugestao" e "motivo".

---
**Incerteza Fornecida:** "${input}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-2-9b-it:generateContent?key=${process.env.GENAI_API_KEY}`,
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
