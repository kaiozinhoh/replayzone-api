// scripts/generateSlugs.js
import db from '../config/db.js';
import * as quadraModel from '../models/quadraModel.js';

async function migrateSlugs() {
  try {
    console.log('Iniciando migração de slugs...');
    
    // Buscar todas as quadras sem slug
    const [quadras] = await db.promise().query(
      'SELECT id, nome FROM quadras WHERE slug IS NULL OR slug = ""'
    );
    
    console.log(`Encontradas ${quadras.length} quadras sem slug`);
    
    let updatedCount = 0;
    
    // Gerar slug para cada quadra
    for (const quadra of quadras) {
      try {
        const slug = await quadraModel.generateUniqueSlug(quadra.nome);
        await db.promise().query(
          'UPDATE quadras SET slug = ?, update_em = NOW() WHERE id = ?',
          [slug, quadra.id]
        );
        updatedCount++;
        console.log(`Slug gerado para quadra ${quadra.id}: ${slug}`);
      } catch (error) {
        console.error(`Erro ao gerar slug para quadra ${quadra.id}:`, error);
      }
    }
    
    console.log(`Migração concluída. ${updatedCount} quadras atualizadas.`);
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSlugs();
}