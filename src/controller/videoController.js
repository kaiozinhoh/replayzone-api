// controllers/videoController.js
import * as videoModel from '../models/videoModel.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { ajustarDatas } from '../utils/ajustarDatas.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Função para obter vídeos por subquadra_id, data, e tipo
export const getVideosBySubquadraDateType = async (req, res) => {
  const { subquadra_id, date, tipo } = req.body;

  if (!subquadra_id || !date || !tipo) {
    return res.status(400).json({ message: 'Parâmetros subquadra_id, date e tipo são obrigatórios.' });
  }

  const start_time = dayjs.tz(date, 'America/Sao_Paulo').startOf('day').format('YYYY-MM-DD HH:mm:ss');
  const end_time = dayjs.tz(date, 'America/Sao_Paulo').endOf('day').format('YYYY-MM-DD HH:mm:ss');

  try {
    const videos = await videoModel.getVideosBySubquadraDateType(subquadra_id, start_time, end_time, tipo);

    if (videos.length === 0) {
      return res.status(404).json({ message: 'Nenhum vídeo encontrado para a data, hora e tipo especificados.' });
    }

    res.status(200).json({ videos: ajustarDatas(videos) });
  } catch (error) {
    console.error('Erro ao consultar os vídeos:', error);
    res.status(500).json({ message: 'Erro ao consultar os vídeos.' });
  }
};

// Função para obter um vídeo pelo ID
export const getVideoById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'O parâmetro id é obrigatório.' });
  }

  try {
    const result = await videoModel.getVideoById(id);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Nenhum vídeo encontrado com o ID especificado.' });
    }

    res.status(200).json({ video: result[0] });
  } catch (error) {
    console.error('Erro ao consultar o vídeo:', error);
    res.status(500).json({ message: 'Erro ao consultar o vídeo.' });
  }
};

// Função para obter vídeos por um intervalo de uma hora
export const getVideosByHourInterval = async (req, res) => {
  const { subquadra_id, data_hora } = req.body;

  if (!subquadra_id || !data_hora) {
    return res.status(400).json({ error: 'subquadra_id e data_hora são obrigatórios' });
  }
  console.log("TEste",subquadra_id,data_hora)
  const startTime = dayjs(data_hora).startOf('hour');
  const endTime = startTime.add(1, 'hour');
  try {
    const videos = await videoModel.getVideosByHourInterval(
      subquadra_id,
      startTime.format('YYYY-MM-DD HH:mm:ss'),
      endTime.format('YYYY-MM-DD HH:mm:ss')
    );
     console.log("REQUISIÇÂO",subquadra_id,
      startTime.format('YYYY-MM-DD HH:mm:ss'),
      endTime.format('YYYY-MM-DD HH:mm:ss'))
    if (videos.length === 0) {
      return res.status(404).json({ message: 'Nenhum vídeo encontrado para este intervalo' });
    }

    res.json({ videos: ajustarDatas(videos) });
  } catch (error) {
    console.error('Erro ao consultar o banco de dados:', error);
    res.status(500).json({ error: 'Erro ao consultar o banco de dados' });
  }
};

// Função para obter vídeos agrupados por hora específica
export const getGroupedVideos = async (req, res) => {
  const { subquadra_id, date, hour } = req.body;

  if (!subquadra_id || !date || !hour) {
    return res.status(400).json({ 
      success: false,
      message: 'Parâmetros subquadra_id, date e hour são obrigatórios.' 
    });
  }

  try {
    const videos = await videoModel.getGroupedVideos(subquadra_id, date, hour);
    
    if (videos.length === 0) {
      return res.status(200).json({ 
        success: true,
        groups: [],
        message: 'Nenhum vídeo encontrado para este horário.' 
      });
    }

    // Agrupar os vídeos
    const groupedVideos = videoModel.groupVideos(videos);
    
    res.status(200).json({ 
      success: true,
      groups: ajustarDatas(groupedVideos)
    });
  } catch (error) {
    console.error('Erro ao consultar os vídeos agrupados:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao consultar os vídeos.' 
    });
  }
};



// Função para obter vídeos agrupados por data (para contagem de horas)
export const getGroupedVideosByDate = async (req, res) => {
  const { subquadra_id, date } = req.body;

  if (!subquadra_id || !date) {
    return res.status(400).json({ 
      success: false,
      message: 'Parâmetros subquadra_id e date são obrigatórios.' 
    });
  }

  try {
    const videos = await videoModel.getGroupedVideosByDate(subquadra_id, date);
    
    if (videos.length === 0) {
      return res.status(200).json({ 
        success: true,
        groups: [],
        message: 'Nenhum vídeo encontrado para esta data.' 
      });
    }

    // Agrupar os vídeos
    const groupedVideos = videoModel.groupVideos(videos);
    
    res.status(200).json({ 
      success: true,
      groups: ajustarDatas(groupedVideos)
    });
  } catch (error) {
    console.error('Erro ao consultar os vídeos agrupados por data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao consultar os vídeos.' 
    });
  }
};


