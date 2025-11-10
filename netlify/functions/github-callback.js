import { handleCors, corsHeaders } from './utils/cors.js';

/**
 * Netlify Function - Callback do GitHub OAuth
 * Recebe o código de autorização e troca por access token
 */
export async function handler(event) {
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    const { code } = event.queryStringParameters || {};

    if (!code) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Código de autorização não fornecido' })
      };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Credenciais GitHub não configuradas. Adicione GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET.' 
        })
      };
    }

    // Trocar código por access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: tokenData.error_description || 'Erro ao obter token' })
      };
    }

    // Redirecionar de volta para a página com o token
    const redirectUrl = `${process.env.URL}/pages/repository-config.html?token=${tokenData.access_token}`;
    
    return {
      statusCode: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('Erro no callback GitHub:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}
