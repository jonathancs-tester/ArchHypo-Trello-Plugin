// Utilitário para limpeza e parsing seguro de JSON da LLM

export function cleanAndParseJSON(rawContent, fallbackData = {}) {
  let cleaned = rawContent.trim();
  
  // Remover blocos de código markdown
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json|```/gi, "").trim();
  }
  
  // Limpeza adicional para caracteres de controle
  cleaned = cleaned
    .replace(/[\r\n\t]/g, ' ')      // Remove quebras de linha e tabs
    .replace(/\s+/g, ' ')           // Normaliza espaços múltiplos
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
    .trim();

  // Verificar se há múltiplos objetos JSON concatenados
  const jsonObjects = [];
  const regex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let match;
  
  while ((match = regex.exec(cleaned)) !== null) {
    try {
      const parsed = JSON.parse(match[0]);
      jsonObjects.push(parsed);
    } catch (e) {
      // Ignorar objetos que não são JSON válidos
      continue;
    }
  }

  // Se encontramos múltiplos objetos, retornar o primeiro válido
  if (jsonObjects.length > 0) {
    console.log(`🔍 Encontrados ${jsonObjects.length} objetos JSON, usando o primeiro`);
    return jsonObjects[0];
  }
  
  // Fallback: tentar extrair um único JSON válido
  const jsonMatch = cleaned.match(/\{.*\}/s);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error("❌ Erro ao parsear JSON:", cleaned.substring(0, 200) + '...');
    console.error("❌ Erro detalhado:", parseError.message);
    
    // Retornar dados de fallback
    return fallbackData;
  }
}
