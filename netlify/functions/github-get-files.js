import { handleCors, corsHeaders } from './utils/cors.js';

/**
 * Netlify Function para buscar arquivos de um repositório GitHub
 * Lista estrutura de arquivos recursivamente
 */
export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const { token, repository, path = '', branch = 'main' } = JSON.parse(event.body);

    if (!token || !repository) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token e repositório são obrigatórios' })
      };
    }

    // Buscar conteúdo do diretório
    const url = `https://api.github.com/repos/${repository}/contents/${path}?ref=${branch}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Erro ao buscar arquivos do repositório' })
      };
    }

    const files = await response.json();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ files })
    };

  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}
