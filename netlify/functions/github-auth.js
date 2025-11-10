import { handleCors, corsHeaders } from './utils/cors.js';

/**
 * Netlify Function para autenticação GitHub OAuth
 * Gera URL de autenticação OAuth do GitHub
 */
export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const { action } = JSON.parse(event.body || '{}');

    if (action === 'getAuthUrl') {
      // GitHub OAuth App credentials devem estar nas variáveis de ambiente
      const clientId = process.env.GITHUB_CLIENT_ID;
      const redirectUri = process.env.GITHUB_REDIRECT_URI || `${process.env.URL}/.netlify/functions/github-callback`;
      
      if (!clientId) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'GitHub Client ID não configurado. Adicione GITHUB_CLIENT_ID nas variáveis de ambiente.' 
          })
        };
      }

      // URL de autenticação do GitHub
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ authUrl })
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Ação não suportada' })
    };

  } catch (error) {
    console.error('Erro na autenticação GitHub:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}
