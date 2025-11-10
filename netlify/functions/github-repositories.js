import { handleCors, corsHeaders } from './utils/cors.js';

/**
 * Netlify Function para buscar repositórios do GitHub
 * Lista repositórios do usuário autenticado
 */
export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token de acesso não fornecido' })
      };
    }

    // Buscar repositórios do usuário
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Erro ao buscar repositórios' })
      };
    }

    const repos = await response.json();

    // Retornar apenas dados relevantes
    const simplifiedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      updated_at: repo.updated_at,
      private: repo.private,
      default_branch: repo.default_branch
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ repositories: simplifiedRepos })
    };

  } catch (error) {
    console.error('Erro ao buscar repositórios:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}
