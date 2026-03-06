// controllers/quadraController.js
// controllers/quadraController.js
import * as quadraModel from '../models/quadraModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Configuração do Multer para upload de logos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar storage do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = '/home/ftp/videos/logos';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const sponsorName = req.body.sponsorName || 'patrocinador';
    const cleanName = sponsorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${cleanName}_${timestamp}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Verificar se é uma imagem
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
}).single('logo');

// Endpoint para upload de logo de patrocinador
export const uploadSponsorLogo = async (req, res) => {
  try {
    // Configuração mais flexível
    const uploadAny = multer({
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024
      },
      fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Apenas arquivos de imagem são permitidos'), false);
        }
      }
    }).any(); // Aceita qualquer campo de arquivo

    uploadAny(req, res, async function (err) {
      if (err) {
        console.error('Erro no upload:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Erro no upload do arquivo'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
      }

      const quadraId = req.body.quadraId;
      if (!quadraId) {
        // Limpar arquivos se não tiver quadraId
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        return res.status(400).json({
          success: false,
          message: 'ID da quadra é obrigatório'
        });
      }

      // Usar o primeiro arquivo (deve ser apenas um)
      const file = req.files[0];
      const logoUrl = `https://cam.replayzone.com.br/videos/logos/${file.filename}`;

      res.json({
        success: true,
        logoUrl: logoUrl,
        message: 'Logo enviada com sucesso'
      });
    });
  } catch (error) {
    console.error('Erro no upload de logo:', error);
    
    // Limpar arquivos em caso de erro
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao processar upload da logo'
    });
  }
};

// Endpoint para limpar logos não utilizadas
export const cleanupUnusedLogos = async (req, res) => {
  try {
    // Buscar todas as logos em uso
    const connection = await quadraModel.getConnection();
    const [usedLogos] = await connection.execute(
      'SELECT logo_url FROM sponsors WHERE logo_url IS NOT NULL AND logo_url != ""'
    );
    
    const usedFilenames = usedLogos.map(logo => {
      const url = logo.logo_url;
      return url.includes('/') ? url.split('/').pop() : url;
    });
    
    // Listar todos os arquivos no diretório de logos
    const logosPath = '/home/ftp/videos/logos';
    const allFiles = fs.readdirSync(logosPath);
    
    // Deletar arquivos não utilizados
    let deletedCount = 0;
    for (const file of allFiles) {
      if (!usedFilenames.includes(file)) {
        fs.unlinkSync(path.join(logosPath, file));
        deletedCount++;
        console.log(`Arquivo não utilizado deletado: ${file}`);
      }
    }
    
    await connection.end();
    
    res.json({
      success: true,
      deletedCount: deletedCount,
      message: `Limpeza concluída. ${deletedCount} arquivos deletados.`
    });
    
  } catch (error) {
    console.error('Erro na limpeza de logos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar logos não utilizadas'
    });
  }
};
// Obter patrocinadores da quadra
export const getSponsors = async (req, res) => {
  const { quadra_id } = req.params;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    const sponsors = await quadraModel.getSponsorsByQuadraId(quadra_id);
    res.status(200).json(sponsors);
  } catch (error) {
    console.error('Erro ao buscar patrocinadores:', error);
    res.status(500).json({ message: 'Erro ao buscar patrocinadores.' });
  }
};

// controllers/quadraController.js
// Adicione estas configurações de storage após as existentes

// Configuração do Multer para upload de imagens da quadra (logo e fundo)
const quadraStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = '/home/ftp/videos/quadras';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const quadraId = req.body.quadraId;
    const type = req.body.type || 'image'; // 'logo' ou 'fundo'
    const cleanName = `${quadraId}_${type}`.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${cleanName}_${timestamp}${extension}`);
  }
});

const quadraUpload = multer({
  storage: quadraStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Verificar se é uma imagem
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
}).single('logo');

// Endpoint para upload de imagens da quadra (logo e fundo)
export const uploadQuadraImage = async (req, res) => {
  try {
    // Executar o upload com multer
    quadraUpload(req, res, async function (err) {
      if (err) {
        console.error('Erro no upload da imagem da quadra:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Erro no upload do arquivo'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
      }

      const quadraId = req.body.quadraId;
      const type = req.body.type; // 'logo' ou 'fundo'
      
      if (!quadraId || !type) {
        // Limpar arquivo se não tiver os parâmetros necessários
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'ID da quadra e tipo são obrigatórios'
        });
      }

      // Gerar URL pública da imagem
      const imageUrl = `https://cam.replayzone.com.br/videos/quadras/${req.file.filename}`;

      // Atualizar o campo correspondente no banco de dados
      try {
        const fieldName = type === 'logo' ? 'url_image' : 'fundo_url';
        const connection = await getConnection();
        
        await connection.execute(
          `UPDATE quadras SET ${fieldName} = ?, update_em = NOW() WHERE id = ?`,
          [imageUrl, quadraId]
        );
        
        await connection.end();
        
        res.json({
          success: true,
          imageUrl: imageUrl,
          field: fieldName,
          message: 'Imagem enviada e salva com sucesso'
        });
        
      } catch (dbError) {
        console.error('Erro ao atualizar banco de dados:', dbError);
        // Limpar arquivo em caso de erro no banco
        fs.unlinkSync(req.file.path);
        
        res.status(500).json({
          success: false,
          message: 'Erro ao salvar informações no banco de dados'
        });
      }
    });
  } catch (error) {
    console.error('Erro no upload de imagem da quadra:', error);
    
    // Limpar arquivo em caso de erro
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao processar upload da imagem'
    });
  }
};

// Endpoint para limpar imagens de quadras não utilizadas
export const cleanupUnusedQuadraImages = async (req, res) => {
  try {
    // Buscar todas as imagens em uso
    const connection = await getConnection();
    const [usedImages] = await connection.execute(
      'SELECT url_image, fundo_url FROM quadras WHERE url_image IS NOT NULL OR fundo_url IS NOT NULL'
    );
    
    const usedFilenames = [];
    usedImages.forEach(quadra => {
      if (quadra.url_image) {
        const filename = quadra.url_image.includes('/') ? quadra.url_image.split('/').pop() : quadra.url_image;
        usedFilenames.push(filename);
      }
      if (quadra.fundo_url) {
        const filename = quadra.fundo_url.includes('/') ? quadra.fundo_url.split('/').pop() : quadra.fundo_url;
        usedFilenames.push(filename);
      }
    });
    
    // Listar todos os arquivos no diretório de quadras
    const quadrasPath = '/home/ftp/videos/quadras';
    const allFiles = fs.readdirSync(quadrasPath);
    
    // Deletar arquivos não utilizados
    let deletedCount = 0;
    for (const file of allFiles) {
      if (!usedFilenames.includes(file)) {
        fs.unlinkSync(path.join(quadrasPath, file));
        deletedCount++;
        console.log(`Arquivo de quadra não utilizado deletado: ${file}`);
      }
    }
    
    await connection.end();
    
    res.json({
      success: true,
      deletedCount: deletedCount,
      message: `Limpeza concluída. ${deletedCount} arquivos deletados.`
    });
    
  } catch (error) {
    console.error('Erro na limpeza de imagens de quadra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar imagens não utilizadas'
    });
  }
};

// Atualizar patrocinadores
export const updateSponsors = async (req, res) => {
  const { quadra_id } = req.params;
  const { sponsors } = req.body;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    await quadraModel.updateSponsors(quadra_id, sponsors || []);
    res.status(200).json({ message: 'Patrocinadores atualizados com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar patrocinadores:', error);
    res.status(500).json({ message: 'Erro ao atualizar patrocinadores.' });
  }
};

// Gerar vídeo de teste com patrocinadores
export const generateTestVideo = async (req, res) => {
  const { quadra_id } = req.params;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    // Esta função será implementada no replay-server
    // Por enquanto, retornamos uma URL de exemplo
    const testVideoUrl = `https://seuservidor.com/videos/test_${quadra_id}_${Date.now()}.mp4`;
    
    res.status(200).json({
      success: true,
      videoUrl: testVideoUrl,
      message: 'Vídeo de teste gerado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao gerar vídeo de teste:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao gerar vídeo de teste.' 
    });
  }
};

// Obter horário de funcionamento da quadra
export const getHorarioFuncionamento = async (req, res) => {
  const { quadra_id } = req.params;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    const horarios = await quadraModel.getHorarioFuncionamentoByQuadraId(quadra_id);
    res.status(200).json(horarios);
  } catch (error) {
    console.error('Erro ao buscar horário de funcionamento:', error);
    res.status(500).json({ message: 'Erro ao buscar horário de funcionamento.' });
  }
};

// Atualizar horário de funcionamento
export const updateHorarioFuncionamento = async (req, res) => {
  const { quadra_id } = req.params;
  const { horarios } = req.body;

  if (!quadra_id || !horarios) {
    return res.status(400).json({ message: 'ID da quadra e horários são obrigatórios.' });
  }

  try {
    await quadraModel.updateHorarioFuncionamento(quadra_id, horarios);
    res.status(200).json({ message: 'Horário de funcionamento atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar horário de funcionamento:', error);
    res.status(500).json({ message: 'Erro ao atualizar horário de funcionamento.' });
  }
};

// Rota para obter as quadras associadas ao usuário
export const getQuadrasByUsuario = async (req, res) => {
  const { usuario_id } = req.params;

  if (!usuario_id) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }

  try {
    const quadras = await quadraModel.getQuadrasByUsuarioId(usuario_id);

    if (quadras.length === 0) {
      return res.status(404).json({ message: 'Este usuário não tem quadras associadas.' });
    }

    res.status(200).json(quadras);
  } catch (error) {
    console.error('Erro ao consultar as quadras:', error);
    res.status(500).json({ message: 'Erro ao consultar as quadras.' });
  }
};

// Rota para vincular um usuário a uma quadra
export const vincularUsuarioAQuadra = async (req, res) => {
  const { usuarioId, codigoQuadra } = req.body;

  if (!usuarioId || !codigoQuadra) {
    return res.status(400).json({ message: 'Usuário e código da quadra são obrigatórios.' });
  }

  try {
    // Passo 1: Buscar o ID da quadra
    const quadra = await quadraModel.getQuadraByCodigo(codigoQuadra);

    if (quadra.length === 0) {
      return res.status(404).json({ message: 'Quadra não encontrada.' });
    }

    const quadraId = quadra[0].id;

    // Passo 2: Verificar se o vínculo já existe
    const vinculoExistente = await quadraModel.verificarVinculoUsuarioQuadra(usuarioId, quadraId);

    if (vinculoExistente.length > 0) {
      return res.status(400).json({ message: 'Usuário já está vinculado a esta quadra.' });
    }

    // Passo 3: Vincular o usuário à quadra
    await quadraModel.vincularUsuarioAQuadra(usuarioId, quadraId);

    res.status(201).json({ message: 'Usuário vinculado à quadra com sucesso.' });
  } catch (error) {
    console.error('Erro ao vincular o usuário à quadra:', error);
    res.status(500).json({ message: 'Erro ao vincular o usuário à quadra.' });
  }
};

// Rota para excluir um usuário pelo ID
export const desvincularUsuarioDeQuadra = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Selecione sua quadra' });
  }

  try {
    const result = await quadraModel.desvincularUsuarioDeQuadra(id);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Quadra não encontrada.' });
    }

    res.status(200).json({ message: 'Quadra excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir quadra:', error);
    res.status(500).json({ message: 'Erro ao excluir quadra.' });
  }
};

// Rota para criar uma nova quadra
export const createQuadra = async (req, res) => {
  const { nome, endereco, cidade, estado, cep, telefone, url_image } = req.body;

  // Validação dos campos obrigatórios
  if (!nome || !endereco || !cidade || !estado) {
    return res.status(400).json({ 
      message: 'Nome, endereço, cidade e estado são obrigatórios.',
      missing_fields: {
        nome: !nome,
        endereco: !endereco,
        cidade: !cidade,
        estado: !estado
      }
    });
  }

  try {
    const result = await quadraModel.createQuadra({
      nome,
      endereco,
      cidade,
      estado,
      cep: cep || null,
      telefone: telefone || null,
      url_image: url_image || null
    });

    res.status(201).json({
      message: 'Quadra criada com sucesso.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar quadra:', error);
    res.status(500).json({ message: 'Erro ao criar quadra.' });
  }
};

// Rota para atualizar uma quadra
export const updateQuadra = async (req, res) => {
  const { id } = req.params;
  const { 
    nome, 
    endereco, 
    cidade, 
    estado, 
    cep, 
    telefone, 
    url_image,
    chavepix,
    valor_hora,
    tempoparamarcar,
    tempoparacancelar,
    fundo_url
  } = req.body;

  // Validação do ID
  if (!id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  // Validação dos campos obrigatórios
  if (!nome || !endereco || !cidade || !estado) {
    return res.status(400).json({ 
      message: 'Nome, endereço, cidade e estado são obrigatórios.',
      missing_fields: {
        nome: !nome,
        endereco: !endereco,
        cidade: !cidade,
        estado: !estado
      }
    });
  }

  try {
    // Verifica se a quadra existe
    const existingQuadra = await quadraModel.getQuadraById(id);
    if (existingQuadra.length === 0) {
      return res.status(404).json({ message: 'Quadra não encontrada.' });
    }

    const result = await quadraModel.updateQuadra(id, {
      nome,
      endereco,
      cidade,
      estado,
      cep: cep || null,
      telefone: telefone || null,
      url_image: url_image || existingQuadra[0].url_image,
      chavepix: chavepix || null,
      valor_hora: valor_hora || null,
      tempoparamarcar: tempoparamarcar || null,
      tempoparacancelar: tempoparacancelar || null,
      fundo_url: fundo_url || null
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nenhuma alteração foi realizada.' });
    }

    res.status(200).json({
      message: 'Quadra atualizada com sucesso.',
      id: id
    });
  } catch (error) {
    console.error('Erro ao atualizar quadra:', error);
    res.status(500).json({ message: 'Erro ao atualizar quadra.' });
  }
};

// Rota para listar todas as quadras
export const getAllQuadras = async (req, res) => {
  try {
    const quadras = await quadraModel.getAllQuadras();
    
    if (quadras.length === 0) {
      return res.status(404).json({ message: 'Nenhuma quadra encontrada.' });
    }

    res.status(200).json(quadras);
  } catch (error) {
    console.error('Erro ao buscar quadras:', error);
    res.status(500).json({ message: 'Erro ao buscar quadras.' });
  }
};
// Buscar cliente por ID
export const getQuadraById = async (req, res) => {
  const { id } = req.params;

  try {
    const clientes = await quadraModel.getQuadraById(id);
    if (clientes.length === 0) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    res.status(200).json(clientes[0]);
  } catch (error) {
    console.error('Erro ao buscar quadra:', error);
    res.status(500).json({ message: 'Erro ao buscar quadra.' });
  }
};

// Rota para buscar quadra por slug
export const getQuadraBySlug = async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({ message: 'Slug da quadra é obrigatório.' });
  }

  try {
    const quadra = await quadraModel.getQuadraBySlug(slug);
    
    if (quadra.length === 0) {
      return res.status(404).json({ message: 'Quadra não encontrada.' });
    }

    res.status(200).json(quadra[0]);
  } catch (error) {
    console.error('Erro ao buscar quadra por slug:', error);
    res.status(500).json({ message: 'Erro ao buscar quadra.' });
  }
};

// Substitua a função restartAllHlsStreams corrigida:
export const restartAllHlsStreams = async (req, res) => {
  const { quadra_id } = req.params;
  
  console.log(`[restartAllHlsStreams] Iniciando processo para quadra_id: ${quadra_id}`);

  if (!quadra_id) {
    console.error('[restartAllHlsStreams] Erro: ID da quadra não fornecido');
    return res.status(400).json({ 
      success: false,
      message: 'ID da quadra é obrigatório.' 
    });
  }

  try {
    console.log(`[restartAllHlsStreams] Buscando subquadras para quadra_id: ${quadra_id}`);
    // Buscar subquadras usando o model
    const subQuadras = await quadraModel.getSubQuadrasByQuadraIdAndCamera(quadra_id);

    console.log(`[restartAllHlsStreams] Encontradas ${subQuadras?.length || 0} subquadras`);
    
    if (!subQuadras || subQuadras.length === 0) {
      console.warn(`[restartAllHlsStreams] Nenhuma subquadra encontrada para quadra_id: ${quadra_id}`);
      return res.status(404).json({
        success: false,
        message: 'Nenhuma subquadra ativa com cameraId encontrada para esta quadra.'
      });
    }

    const results = [];
    const baseUrl = 'http://127.0.0.1:3010/hls/restart/';
    
    console.log(`[restartAllHlsStreams] Iniciando reinicialização de ${subQuadras.length} streams`);

    for (const subQuadra of subQuadras) {
      try {
        const restartUrl = `${baseUrl}${subQuadra.cameraId}`;
        console.log(`[restartAllHlsStreams] Reiniciando subquadra ${subQuadra.id} (${subQuadra.nome}) - URL: ${restartUrl}`);
        
        const response = await fetch(restartUrl, {
          method: 'GET',
          timeout: 10000
        });

        const success = response.ok;
        console.log(`[restartAllHlsStreams] Resposta para subquadra ${subQuadra.id}: ${success ? 'SUCESSO' : 'FALHA'} - Status: ${response.status}`);
        
        results.push({
          subQuadraId: subQuadra.id,
          subQuadraNome: subQuadra.nome,
          cameraId: subQuadra.cameraId,
          restartUrl: restartUrl,
          success: success,
          status: success ? 'Reiniciado com sucesso' : 'Falha ao reiniciar'
        });

        // Aguardar 500ms entre as requisições
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[restartAllHlsStreams] Erro ao reiniciar stream da subquadra ${subQuadra.id}:`, error.message);
        results.push({
          subQuadraId: subQuadra.id,
          subQuadraNome: subQuadra.nome,
          cameraId: subQuadra.cameraId,
          success: false,
          status: 'Erro na requisição',
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`[restartAllHlsStreams] Processo concluído: ${successful} sucessos, ${failed} falhas`);

    res.json({
      success: true,
      message: `Processo de reinicialização concluído. ${successful} streams reiniciados com sucesso, ${failed} falhas.`,
      totalSubQuadras: subQuadras.length,
      results: results
    });

  } catch (error) {
    console.error('[restartAllHlsStreams] Erro geral ao reiniciar streams HLS:', error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar reinicialização dos streams.',
      error: error.message
    });
  }
};

export const restartHlsStream = async (req, res) => {
  const { sub_quadra_id } = req.params;

  if (!sub_quadra_id) {
    return res.status(400).json({ 
      success: false,
      message: 'ID da subquadra é obrigatório.' 
    });
  }

  try {
    // Buscar subquadra usando o model
    const subQuadras = await quadraModel.getSubQuadraById(sub_quadra_id);

    if (subQuadras.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subquadra não encontrada.'
      });
    }

    const subQuadra = subQuadras[0];

    if (subQuadra.ativo !== 'sim' || !subQuadra.cameraId) {
      return res.status(400).json({
        success: false,
        message: 'Subquadra não está ativa ou não possui cameraId configurado.'
      });
    }

    const restartUrl = `http://69.62.92.206:3010/hls/restart/${subQuadra.cameraId}`;

    const response = await fetch(restartUrl, {
      method: 'GET',
      timeout: 10000
    });

    const success = response.ok;

    res.json({
      success: success,
      message: success ? 'Stream reiniciado com sucesso' : 'Falha ao reiniciar stream',
      data: {
        subQuadraId: subQuadra.id,
        subQuadraNome: subQuadra.nome,
        cameraId: subQuadra.cameraId,
        restartUrl: restartUrl,
        quadraId: subQuadra.quadra_id
      }
    });

  } catch (error) {
    console.error('Erro ao reiniciar stream HLS:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao reiniciar stream.',
      error: error.message
    });
  }
};

// Rota para gerar slugs para quadras existentes (para migração)
export const generateSlugsForExistingQuadras = async (req, res) => {
  try {
    // Buscar todas as quadras sem slug
    const connection = await quadraModel.getConnection();
    const [quadrasSemSlug] = await connection.execute(
      'SELECT id, nome FROM quadras WHERE slug IS NULL OR slug = ""'
    );
    
    let updatedCount = 0;
    
    // Gerar slug para cada quadra
    for (const quadra of quadrasSemSlug) {
      try {
        const slug = await quadraModel.generateUniqueSlug(quadra.nome);
        await quadraModel.updateQuadraSlug(quadra.id, slug);
        updatedCount++;
        console.log(`Slug gerado para quadra ${quadra.id}: ${slug}`);
      } catch (error) {
        console.error(`Erro ao gerar slug para quadra ${quadra.id}:`, error);
      }
    }
    
    await connection.end();
    
    res.json({
      success: true,
      updatedCount: updatedCount,
      message: `Slugs gerados para ${updatedCount} quadras.`
    });
    
  } catch (error) {
    console.error('Erro ao gerar slugs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar slugs para quadras existentes'
    });
  }
};