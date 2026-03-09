import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

export const ajustarDatas = (dados) => {
  const ajustarData = (valor) => {
    if (valor instanceof Date || isISOString(valor)) {
      // Ajuste de -2 horas nas datas das requisições
      return dayjs.utc(valor).subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss');
    }
    return valor;
  };

  const isISOString = (value) => {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value);
  };

  // Se for um array de grupos
  if (Array.isArray(dados) && dados.length > 0 && dados[0].videos) {
    return dados.map(grupo => {
      const grupoAjustado = { ...grupo };
      
      // Ajustar a data do grupo
      if (grupo.createdAt) {
        grupoAjustado.createdAt = ajustarData(grupo.createdAt);
      }
      
      // Ajustar cada vídeo dentro do grupo
      if (Array.isArray(grupo.videos)) {
        grupoAjustado.videos = grupo.videos.map(video => {
          const videoAjustado = { ...video };
          if (video.criado_em) {
            videoAjustado.criado_em = ajustarData(video.criado_em);
          }
          return videoAjustado;
        });
      }
      
      return grupoAjustado;
    });
  }
  
  // Se for um array normal de vídeos (para compatibilidade com rotas antigas)
  if (Array.isArray(dados)) {
    return dados.map(item => {
      const itemAjustado = { ...item };
      if (item.criado_em) {
        itemAjustado.criado_em = ajustarData(item.criado_em);
      }
      return itemAjustado;
    });
  }
  
  // Se for um objeto único
  if (typeof dados === 'object' && dados !== null) {
    const dadosAjustados = { ...dados };
    if (dados.criado_em) {
      dadosAjustados.criado_em = ajustarData(dados.criado_em);
    }
    return dadosAjustados;
  }
  
  return dados;
};