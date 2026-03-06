// server.js (parte atualizada)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import videoRoutes from './routes/videosRoutes.js';
import userRoutes from './routes/userRoutes.js';
import quadraRoutes from './routes/quadraRoutes.js';
import subquadraRoutes from './routes/subquadraRoutes.js';
import clientesRoutes from './routes/clienteRoutes.js';
import reservaRoutes from './routes/reservaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import './financeiro/cobranca.js'; // Agendador
import { verificarInadimplenciaEBlocarQuadras } from './financeiro/verificaInadimplencia.js';
import { verificarStatusCliente } from './services/inadimplenciaService.js';
import userAuthRoutes from './routes/userAuthRoutes.js';
import * as quadraModel from './models/quadraModel.js';
import cobrancasRoutes from './routes/cobrancaRoutes.js';

const app = express();
app.use(express.json());

// Configuração do CORS (mantenha igual)
app.use(cors({
  origin: [
    'https://app.replayzone.com.br', 
    'https://www.replayzone.com.br',
    'https://admin.replayzone.com.br',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'x-api-key', 
    'Authorization', 
    'Accept',
    'X-Requested-With'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options('*', cors());

// ============================================
// LOG GLOBAL PARA VER TODAS AS REQUISIÇÕES
// ============================================
app.use('/api', (req, res, next) => {
  console.log('\n=== 🌐 REQUISIÇÃO RECEBIDA ===');
  console.log('🕒 Timestamp:', new Date().toISOString());
  console.log('📍 URL Completa:', req.method, req.originalUrl);
  console.log('📋 Headers:', {
    'x-api-key': req.headers['x-api-key'] ? '✅ PRESENTE' : '❌ AUSENTE',
    'authorization': req.headers['authorization'] ? '🔑 PRESENTE' : '❌ AUSENTE',
    'content-type': req.headers['content-type'] || 'não especificado',
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
  });
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('📦 Body:', req.body);
  }
  console.log('===============================\n');
  next();
});

const API_KEY = process.env.API_KEY || 'Kaioh@30052003';

// ============================================
// MIDDLEWARE DE VERIFICAÇÃO DE API KEY
// ============================================
const verifyApiKey = (req, res, next) => {
  console.log('\n🔐 VERIFY API KEY - Iniciando verificação...');
  const apiKey = req.headers['x-api-key'];
  console.log('API Key recebida:', apiKey ? `${apiKey.substring(0, 5)}...` : 'Nenhuma');
  console.log('API Key esperada:', API_KEY.substring(0, 5) + '...');
  
  if (!apiKey || apiKey !== API_KEY) {
    console.log('❌ API Key inválida ou ausente');
    console.log('Motivo:', !apiKey ? 'API Key não fornecida' : 'API Key não corresponde');
    return res.status(403).json({ 
      success: false,
      message: 'API Key inválida ou ausente' 
    });
  }
  
  console.log('✅ API Key válida, prosseguindo...');
  console.log('🔚 Fim do verifyApiKey\n');
  next();
};

// ============================================
// ROTAS PÚBLICAS (NÃO PASSAM PELO VERIFY API KEY)
// ============================================

// Healthcheck para Docker / EasyPanel
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'replayzone-api' });
});

// ✅ Rota de teste manual COM BLOQUEIO DE QUADRAS
app.post('/teste-inadimplencia', async (req, res) => {
  console.log('\n🧪 Rota /teste-inadimplencia acessada');
  try {
    const resultados = await verificarInadimplenciaEBlocarQuadras();
    console.log('✅ Teste de inadimplência executado com sucesso');
    res.status(200).json({
      message: 'Verificação de inadimplência COM BLOQUEIO executada manualmente.',
      resumo: {
        clientesAtrasados: resultados.clientesAtrasados.length,
        quadrasBloqueadas: resultados.quadrasBloqueadas.length,
        quadrasDesbloqueadas: resultados.quadrasDesbloqueadas.length
      },
      detalhes: resultados,
    });
  } catch (error) {
    console.error('❌ Erro no teste manual de inadimplência:', error.message);
    res.status(500).json({ message: 'Erro ao executar verificação manual.' });
  }
});

// ✅ Rota para verificar status de cliente
app.get('/status-cliente/:clienteId', async (req, res) => {
  console.log('\n👤 Rota /status-cliente/:clienteId acessada');
  console.log('clienteId:', req.params.clienteId);
  try {
    const { clienteId } = req.params;
    const status = await verificarStatusCliente(clienteId);
    
    if (status.error) {
      return res.status(404).json(status);
    }
    
    console.log('✅ Status do cliente verificado com sucesso');
    res.status(200).json(status);
  } catch (error) {
    console.error('❌ Erro ao verificar status do cliente:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ✅ Rota para vincular cliente à quadra
app.post('/vincular-cliente-quadra', async (req, res) => {
  console.log('\n🔗 Rota /vincular-cliente-quadra acessada');
  console.log('Body:', req.body);
  try {
    const { quadraId, clienteId } = req.body;
    
    if (!quadraId || !clienteId) {
      console.log('❌ quadraId ou clienteId não fornecidos');
      return res.status(400).json({ 
        success: false, 
        error: 'quadraId e clienteId são obrigatórios' 
      });
    }
    
    await quadraModel.vincularClienteAQuadra(quadraId, clienteId);
    
    console.log('✅ Cliente vinculado à quadra com sucesso');
    res.json({ 
      success: true, 
      message: 'Cliente vinculado à quadra com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao vincular cliente à quadra:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// APLICA MIDDLEWARE DE API KEY PARA TODAS AS ROTAS /api
// ============================================
console.log('\n🛡️ Aplicando middleware verifyApiKey para todas as rotas /api');
app.use('/api', verifyApiKey);

// ============================================
// ROTAS PROTEGIDAS PELA API KEY
// ============================================
console.log('📦 Registrando rotas protegidas...');

app.use('/api', videoRoutes);
console.log('  ✅ videoRoutes registrado');

app.use('/api', userRoutes);
console.log('  ✅ userRoutes registrado');

app.use('/api', quadraRoutes);
console.log('  ✅ quadraRoutes registrado');

app.use('/api', cobrancasRoutes);
console.log('  ✅ pagamentoRoutes registrado');

app.use('/api', subquadraRoutes);
console.log('  ✅ subquadraRoutes registrado');

app.use('/api', clientesRoutes);
console.log('  ✅ clientesRoutes registrado');

app.use('/api', reservaRoutes);
console.log('  ✅ reservaRoutes registrado');

app.use('/api', adminRoutes);
console.log('  ✅ adminRoutes registrado');

app.use('/api', userAuthRoutes);
console.log('  ✅ userAuthRoutes registrado');




// ============================================
// SERVIÇO DE ARQUIVOS ESTÁTICOS (path configurável para Docker)
// ============================================
const staticVideosPath = process.env.STATIC_VIDEOS_PATH || '/home/ftp/videos/logos';
try {
  app.use('/videos/logos', express.static(staticVideosPath));
  console.log('  ✅ Servidor de arquivos estáticos configurado:', staticVideosPath);
} catch (e) {
  console.warn('  ⚠️ Pasta de vídeos não encontrada, rota /videos/logos desabilitada');
}

// ============================================
// INICIA O SERVIDOR
// ============================================
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('\n=================================');
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📅 Iniciado em: ${new Date().toLocaleString()}`);
  console.log('✅ Sistema de inadimplência COM BLOQUEIO está ativo');
  console.log('=================================\n');
});