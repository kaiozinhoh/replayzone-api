// controllers/subquadraController.js
import * as subquadraModel from '../models/SubquadraModel.js';
import * as quadraModel from '../models/quadraModel.js'; // Importe o modelo de quadra

// Rota para obter as subquadras de uma quadra pelo SLUG da quadra
export const getSubquadrasByQuadraSlug = async (req, res) => {
  const { quadraSlug } = req.params;

  if (!quadraSlug) {
    return res.status(400).json({ message: 'Slug da quadra é obrigatório.' });
  }

  try {
    // Primeiro buscar a quadra pelo slug para obter o ID
    const quadra = await quadraModel.getQuadraBySlug(quadraSlug);
    
    if (quadra.length === 0) {
      return res.status(404).json({ message: 'Quadra não encontrada.' });
    }

    const quadraId = quadra[0].id;
    
    // Depois buscar as subquadras pelo ID da quadra
    const subquadras = await subquadraModel.getSubquadrasByQuadraId(quadraId);

    if (subquadras.length === 0) {
      return res.status(404).json({ message: 'Nenhuma subquadra encontrada para esta quadra.' });
    }

    res.status(200).json(subquadras);
  } catch (error) {
    console.error('Erro ao consultar as subquadras:', error);
    res.status(500).json({ message: 'Erro ao consultar as subquadras.' });
  }
};

// Rota para obter subquadras detalhadas pelo SLUG da quadra
export const getSubquadrasDetalhadasBySlug = async (req, res) => {
  const { quadraSlug } = req.params;

  if (!quadraSlug) {
    return res.status(400).json({ message: 'Slug da quadra é obrigatório.' });
  }

  try {
    // Primeiro buscar a quadra pelo slug para obter o ID
    const quadra = await quadraModel.getQuadraBySlug(quadraSlug);
    
    if (quadra.length === 0) {
      return res.status(404).json({ message: 'Quadra não encontrada.' });
    }

    const quadraId = quadra[0].id;
    
    // Depois buscar as subquadras detalhadas pelo ID da quadra
    const subquadras = await subquadraModel.getSubquadrasWithVideoCount(quadraId);

    if (subquadras.length === 0) {
      return res.status(404).json({ message: 'Nenhuma subquadra encontrada para esta quadra.' });
    }

    res.status(200).json(subquadras);
  } catch (error) {
    console.error('Erro ao buscar subquadras:', error);
    res.status(500).json({ message: 'Erro ao buscar subquadras.' });
  }
};
// Rota para obter as subquadras de uma quadra pelo ID da quadra
export const getSubquadrasByQuadra = async (req, res) => {
  const { quadra_id } = req.params;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    const subquadras = await subquadraModel.getSubquadrasByQuadraId(quadra_id);

    if (subquadras.length === 0) {
      return res.status(404).json({ message: 'Nenhuma subquadra encontrada para esta quadra.' });
    }

    res.status(200).json(subquadras);
  } catch (error) {
    console.error('Erro ao consultar as subquadras:', error);
    res.status(500).json({ message: 'Erro ao consultar as subquadras.' });
  }
};
// Rota para listar todas as quadras
export const getAllSubQuadras = async (req, res) => {
  try {
    const quadras = await subquadraModel.getAllSubQuadras();
    
    if (quadras.length === 0) {
      return res.status(404).json({ message: 'Nenhuma Subquadra encontrada.' });
    }

    res.status(200).json(quadras);
  } catch (error) {
    console.error('Erro ao buscar subquadras:', error);
    res.status(500).json({ message: 'Erro ao buscar subquadras.' });
  }
};
// Rota para buscar uma subquadra pelo ID
export const getSubquadraById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID da subquadra é obrigatório.' });
  }

  try {
    const result = await subquadraModel.getSubquadraById(id);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Subquadra não encontrada.' });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.error('Erro ao consultar a subquadra:', error);
    res.status(500).json({ message: 'Erro ao consultar a subquadra.' });
  }
};

// Rota para criar uma nova subquadra
export const createSubquadra = async (req, res) => {
  const { nome, quadra_id, tipo } = req.body;

  // Validação dos campos obrigatórios
  if (!nome || !quadra_id || !tipo) {
    return res.status(400).json({ 
      message: 'Nome, ID da quadra e tipo são obrigatórios.',
      missing_fields: {
        nome: !nome,
        quadra_id: !quadra_id,
        tipo: !tipo
      }
    });
  }

  try {
    const result = await subquadraModel.createSubquadra({
      nome,
      quadra_id,
      tipo
    });

    res.status(201).json({
      message: 'Subquadra criada com sucesso.',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erro ao criar subquadra:', error);
    res.status(500).json({ message: 'Erro ao criar subquadra.' });
  }
};

// Rota para atualizar uma subquadra
export const updateSubquadra = async (req, res) => {
  const { id } = req.params;
  const { nome, quadra_id, tipo } = req.body;

  // Validação do ID
  if (!id) {
    return res.status(400).json({ message: 'ID da subquadra é obrigatório.' });
  }

  // Validação dos campos obrigatórios
  if (!nome || !quadra_id || !tipo) {
    return res.status(400).json({ 
      message: 'Nome, ID da quadra e tipo são obrigatórios.',
      missing_fields: {
        nome: !nome,
        quadra_id: !quadra_id,
        tipo: !tipo
      }
    });
  }

  try {
    // Verifica se a subquadra existe
    const existingSubquadra = await subquadraModel.getSubquadraById(id);
    if (existingSubquadra.length === 0) {
      return res.status(404).json({ message: 'Subquadra não encontrada.' });
    }

    const result = await subquadraModel.updateSubquadra(id, {
      nome,
      quadra_id,
      tipo
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nenhuma alteração foi realizada.' });
    }

    res.status(200).json({
      message: 'Subquadra atualizada com sucesso.',
      id: id
    });
  } catch (error) {
    console.error('Erro ao atualizar subquadra:', error);
    res.status(500).json({ message: 'Erro ao atualizar subquadra.' });
  }
};

// Rota para buscar todos os vídeos de uma subquadra
export const getVideosBySubquadra = async (req, res) => {
  const { subquadra_id } = req.params;

  if (!subquadra_id) {
    return res.status(400).json({ message: 'ID da subquadra é obrigatório.' });
  }

  try {
    // Primeiro verifica se a subquadra existe
    const subquadra = await subquadraModel.getSubquadraById(subquadra_id);
    if (subquadra.length === 0) {
      return res.status(404).json({ message: 'Subquadra não encontrada.' });
    }

    const videos = await subquadraModel.getVideosBySubquadraId(subquadra_id);

    if (videos.length === 0) {
      return res.status(404).json({ message: 'Nenhum vídeo encontrado para esta subquadra.' });
    }

    res.status(200).json({
      subquadra: subquadra[0],
      videos: videos
    });
  } catch (error) {
    console.error('Erro ao buscar vídeos da subquadra:', error);
    res.status(500).json({ message: 'Erro ao buscar vídeos da subquadra.' });
  }
};

// Rota para listar todas as subquadras de uma quadra com informações detalhadas
export const getSubquadrasDetalhadas = async (req, res) => {
  const { quadra_id } = req.params;

  if (!quadra_id) {
    return res.status(400).json({ message: 'ID da quadra é obrigatório.' });
  }

  try {
    const subquadras = await subquadraModel.getSubquadrasWithVideoCount(quadra_id);

    if (subquadras.length === 0) {
      return res.status(404).json({ message: 'Nenhuma subquadra encontrada para esta quadra.' });
    }

    res.status(200).json(subquadras);
  } catch (error) {
    console.error('Erro ao buscar subquadras:', error);
    res.status(500).json({ message: 'Erro ao buscar subquadras.' });
  }
};
