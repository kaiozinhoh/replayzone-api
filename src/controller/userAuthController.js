// controllers/userAuthController.js
import * as userModel from '../models/userModel.js';
import * as authModel from '../models/userAuthModel.js';
import jwt from '../token.js';

// Gerar código de 6 dígitos
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Iniciar login por telefone para usuários comuns
export const initPhoneLogin = async (req, res) => {
  const { nome, telefone } = req.body;

  if (!telefone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' });
  }

  try {
    console.log('Recebida requisição de login por telefone:', { nome, telefone });
    
    // Verificar se usuário existe
    let user = await userModel.getUserByPhone(telefone);
    let isNewUser = false;

    // Se não existe, criar usuário
    if (!user) {
      if (!nome) {
        return res.status(400).json({ error: 'Nome é obrigatório para novo usuário' });
      }
      
      // Criar usuário (sem senha inicial)
      const result = await userModel.createUser(nome, null, null, telefone);
      user = { id: result.insertId, nome, telefone };
      isNewUser = true;
      console.log('Novo usuário criado:', user);
    } else {
      console.log('Usuário existente encontrado:', user);
    }

    // Gerar e salvar código
    const code = generateCode();
    console.log('Código gerado:', code);
    await authModel.saveVerificationCode(user.id, telefone, code);

    // Enviar código via webhook n8n - COM MELHOR TRATAMENTO DE ERRO
    let webhookStatus = 'failed';
    let webhookError = null;
    
    try {
      console.log('Enviando código para webhook n8n...');
      
      // Configuração do fetch com timeout
      const controller = new AbortController();
      const timeout = 15000; // 15 segundos
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Adicionar headers para evitar problemas CORS/SSL
      const webhookUrl = 'https://bot.replayzone.com.br/webhook/CONFIRMARRESERVASREPLAYZONE';
      console.log('URL do webhook:', webhookUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ReplayZone-API/1.0'
        },
        body: JSON.stringify({ 
          telefone, 
          code,
          nome: nome || user.nome,
          timestamp: new Date().toISOString(),
          codigo: 'sim',
          type: 'verification_code'
        }),
        signal: controller.signal,
        // Configurações adicionais para evitar problemas de rede
        keepalive: true,
        redirect: 'follow'
      }).catch(fetchError => {
        console.error('Erro no fetch:', fetchError);
        throw fetchError;
      });

      clearTimeout(timeoutId);

      console.log('Status do webhook:', response.status, response.statusText);
      
      if (response.ok) {
        webhookStatus = 'success';
        try {
          const responseData = await response.json();
          console.log('Resposta do webhook:', responseData);
        } catch (jsonError) {
          const textResponse = await response.text();
          console.log('Resposta (texto):', textResponse.substring(0, 200));
        }
      } else {
        const errorText = await response.text();
        console.error('Erro do webhook:', errorText.substring(0, 500));
        webhookError = `HTTP ${response.status}: ${response.statusText}`;
      }
      
    } catch (error) {
      console.error('Erro ao enviar para webhook:');
      console.error('- Tipo:', error.name);
      console.error('- Mensagem:', error.message);
      console.error('- Código:', error.code);
      
      webhookError = error.message;
      
      // Detectar tipo específico de erro
      if (error.name === 'AbortError') {
        webhookError = 'Timeout: O webhook demorou muito para responder';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        webhookError = 'Não foi possível conectar ao servidor do webhook';
      } else if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        webhookError = 'Problema com certificado SSL do webhook';
      }
    }

    // SEMPRE retornar sucesso, mas incluir status do webhook
    res.json({ 
      success: true,
      message: webhookStatus === 'success' ? 'Código enviado com sucesso' : 'Código gerado, mas houve problema no envio',
      userId: user.id, 
      isNewUser,
      webhookStatus,
      webhookError: webhookError || undefined,
      code: process.env.NODE_ENV === 'development' ? code : undefined // Retorna código apenas em dev
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verificar código para usuários comuns
export const verifyCode = async (req, res) => {
  const { userId, telefone, code } = req.body;

  try {
    console.log('Verificando código:', { userId, telefone, code });
    
    // Verificar código
    const isValid = await authModel.verifyCode(userId, telefone, code);
    
    if (!isValid) {
      console.log('Código inválido');
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    console.log('Código válido');
    
    // Gerar token JWT
    const token = jwt.CreateJWT(userId);

    // Buscar dados do usuário
    const users = await userModel.getUserById(userId);
    console.log("Usuario", users);
    
    // Verificar se encontrou o usuário
    if (!users || users.length === 0) {
      console.log('Usuário não encontrado');
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = users[0]; // Pegar o primeiro usuário do array
    
    console.log("teste", user.id, user.nome, user.telefone, user.email);
    
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        telefone: user.telefone,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ error: 'Erno interno do servidor' });
  }
};