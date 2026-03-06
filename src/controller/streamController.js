// controllers/streamController.js
import * as streamModel from '../models/streamModel.js';
import { google } from 'googleapis';

// Configuração do OAuth2 do YouTube
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || `${process.env.BASE_URL}/auth/youtube/callback`
);

// Gerar URL de autenticação do YouTube
export const getYouTubeAuthUrl = async (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ],
      prompt: 'consent' // Força a solicitação de refresh token
    });

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação do YouTube:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar URL de autenticação' 
    });
  }
};

// Processar callback do YouTube OAuth
export const handleYouTubeCallback = async (req, res) => {
  try {
    const { code } = req.query;
    const userId = req.user.id; // Assumindo que você tem middleware de autenticação

    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código de autorização não fornecido' 
      });
    }

    // Trocar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obter informações do canal
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: 'snippet',
      mine: true
    });

    const channel = channelResponse.data.items[0];
    const channelId = channel.id;
    const channelName = channel.snippet.title;

    // Calcular data de expiração
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));

    // Salvar credenciais no banco
    await streamModel.saveYouTubeCredentials(
      userId,
      tokens.access_token,
      tokens.refresh_token,
      channelId,
      channelName,
      expiresAt
    );

    res.json({ 
      success: true, 
      message: 'Conta do YouTube conectada com sucesso',
      channel: channelName
    });

  } catch (error) {
    console.error('Erro no callback do YouTube:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao processar autenticação do YouTube' 
    });
  }
};

// Iniciar transmissão no YouTube
export const startYouTubeStream = async (req, res) => {
  try {
    const { title, description, privacy = 'public' } = req.body;
    const userId = req.user.id;

    // Obter credenciais do usuário
    const credentials = await streamModel.getYouTubeCredentials(userId);
    
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        error: 'Conta do YouTube não conectada' 
      });
    }

    // Configurar cliente OAuth com tokens do usuário
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Criar transmissão
    const broadcastResponse = await youtube.liveBroadcasts.insert({
      part: 'snippet,status,contentDetails',
      requestBody: {
        snippet: {
          title: title || 'Transmissão ao vivo - Minha Quadra',
          description: description || 'Transmissão ao vivo de partidas na quadra',
          scheduledStartTime: new Date().toISOString()
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
          enableEmbed: true
        }
      }
    });

    // Criar stream
    const streamResponse = await youtube.liveStreams.insert({
      part: 'snippet,cdn,contentDetails,status',
      requestBody: {
        snippet: {
          title: title || 'Transmissão ao vivo - Minha Quadra'
        },
        cdn: {
          format: '1080p',
          ingestionType: 'rtmp'
        }
      }
    });

    // Vincular broadcast com stream
    await youtube.liveBroadcasts.bind({
      id: broadcastResponse.data.id,
      part: 'id,contentDetails',
      streamId: streamResponse.data.id
    });

    // Atualizar status no banco
    await streamModel.updateYouTubeStreamStatus(
      userId,
      true,
      streamResponse.data.cdn.ingestionInfo.streamName,
      streamResponse.data.cdn.ingestionInfo.ingestionAddress
    );

    // Adicionar ao histórico
    await streamModel.addStreamToHistory(
      userId,
      'youtube',
      title || 'Transmissão ao vivo - Minha Quadra',
      description || 'Transmissão ao vivo de partidas na quadra',
      new Date(),
      `https://www.youtube.com/watch?v=${broadcastResponse.data.id}`
    );

    res.json({
      success: true,
      message: 'Transmissão iniciada com sucesso',
      stream: {
        id: broadcastResponse.data.id,
        title: broadcastResponse.data.snippet.title,
        url: `https://www.youtube.com/watch?v=${broadcastResponse.data.id}`,
        streamUrl: streamResponse.data.cdn.ingestionInfo.ingestionAddress,
        streamKey: streamResponse.data.cdn.ingestionInfo.streamName
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar transmissão no YouTube:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao iniciar transmissão no YouTube' 
    });
  }
};

// Parar transmissão no YouTube
export const stopYouTubeStream = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obter credenciais do usuário
    const credentials = await streamModel.getYouTubeCredentials(userId);
    
    if (!credentials) {
      return res.status(400).json({ 
        success: false, 
        error: 'Conta do YouTube não conectada' 
      });
    }

    // Configurar cliente OAuth com tokens do usuário
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Obter transmissões ativas
    const broadcastsResponse = await youtube.liveBroadcasts.list({
      part: 'id,snippet,status',
      broadcastStatus: 'active'
    });

    if (broadcastsResponse.data.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nenhuma transmissão ativa encontrada' 
      });
    }

    const broadcast = broadcastsResponse.data.items[0];

    // Encerrar transmissão
    await youtube.liveBroadcasts.transition({
      id: broadcast.id,
      part: 'id,status',
      broadcastStatus: 'complete'
    });

    // Atualizar status no banco
    await streamModel.updateYouTubeStreamStatus(userId, false);

    // Atualizar histórico
    // (Você precisaria rastrear o ID da transmissão no histórico para atualizar corretamente)

    res.json({
      success: true,
      message: 'Transmissão encerrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao parar transmissão no YouTube:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao parar transmissão no YouTube' 
    });
  }
};

// Instagram (implementação básica - a API do Instagram é mais restritiva)
export const getInstagramAuthUrl = async (req, res) => {
  try {
    // Instagram requer aprovação especial para acesso à API de transmissão ao vivo
    // Esta é uma implementação simplificada
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${process.env.INSTAGRAM_REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
    
    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Erro ao gerar URL de autenticação do Instagram:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar URL de autenticação' 
    });
  }
};

// Obter status da transmissão atual
export const getStreamStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const [youtubeStatus, instagramStatus] = await Promise.all([
      streamModel.getYouTubeCredentials(userId),
      streamModel.getInstagramCredentials(userId)
    ]);

    res.json({
      success: true,
      youtube: youtubeStatus ? {
        connected: true,
        isLive: youtubeStatus.is_live,
        channelName: youtubeStatus.channel_name,
        streamUrl: youtubeStatus.stream_url
      } : { connected: false },
      instagram: instagramStatus ? {
        connected: true,
        isLive: instagramStatus.is_live,
        username: instagramStatus.username,
        streamUrl: instagramStatus.stream_url
      } : { connected: false }
    });

  } catch (error) {
    console.error('Erro ao obter status da transmissão:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter status da transmissão' 
    });
  }
};

// Obter histórico de transmissões
export const getStreamHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const history = await streamModel.getStreamHistory(userId, parseInt(limit));

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('Erro ao obter histórico de transmissões:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao obter histórico de transmissões' 
    });
  }
};