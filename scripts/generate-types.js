#!/usr/bin/env node

/**
 * Script para gerar tipos TypeScript do Supabase
 * 
 * Uso:
 *   npm run types:generate
 * 
 * Este script conecta ao Supabase via MCP e gera os tipos atualizados
 * baseados no schema atual do banco de dados.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Gerando tipos do Supabase...\n');

// Verifica se o Supabase CLI está instalado
try {
  execSync('npx supabase --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Supabase CLI não encontrado!');
  console.log('\n💡 Instalando Supabase CLI...');
  execSync('npm install supabase --save-dev', { stdio: 'inherit' });
}

// Lê as variáveis de ambiente
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não encontrado no .env');
  console.log('\n💡 Certifique-se de ter um arquivo .env ou .env.local com:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  process.exit(1);
}

// Extrai o project ref da URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Não foi possível extrair o project ref da URL');
  process.exit(1);
}

console.log(`📦 Projeto: ${projectRef}`);
console.log('🔗 Conectando ao Supabase...\n');

try {
  // Gera os tipos usando Supabase CLI
  const types = execSync(
    `npx supabase gen types typescript --project-id ${projectRef}`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  // Salva os tipos
  const typesPath = path.join(__dirname, '..', 'types', 'database.types.ts');
  fs.writeFileSync(typesPath, types);

  console.log('✅ Tipos gerados com sucesso!');
  console.log(`📄 Arquivo: types/database.types.ts\n`);

  // Estatísticas
  const lines = types.split('\n').length;
  const tables = (types.match(/Tables: \{/g) || []).length;
  
  console.log('📊 Estatísticas:');
  console.log(`   • ${lines} linhas de código`);
  console.log(`   • ~${tables} tabelas encontradas`);
  console.log('');
  console.log('🎉 Pronto! Os tipos estão atualizados com o schema do banco.\n');

} catch (error) {
  console.error('❌ Erro ao gerar tipos:', error.message);
  console.log('\n💡 Alternativas:');
  console.log('   1. Peça ao Cursor para regenerar: "Regenere os tipos do Supabase"');
  console.log('   2. Baixe manualmente do Dashboard: https://supabase.com/dashboard/project/' + projectRef + '/api');
  process.exit(1);
}
