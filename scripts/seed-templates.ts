/**
 * Script para gerar templates de prescrição com IA
 * Execute: npx tsx scripts/seed-templates.ts
 */

import { createClient } from "@supabase/supabase-js";
import { generateMultipleTemplates, DEFAULT_TEMPLATES_CONFIG } from "../lib/ai/generate-templates";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Variáveis de ambiente Supabase não configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTemplates(doctorId: string) {
  console.log("\n🤖 Gerando templates de prescrição com IA...\n");

  try {
    // Gerar templates com IA
    const templates = await generateMultipleTemplates(DEFAULT_TEMPLATES_CONFIG);

    console.log(`\n✅ ${templates.length} templates gerados pela IA`);
    console.log("\n📥 Salvando templates no Supabase...\n");

    // Salvar no banco
    let savedCount = 0;
    for (const template of templates) {
      try {
        const { error } = await supabase.from("prescription_templates").insert({
          doctor_id: doctorId,
          ...template,
        });

        if (error) throw error;

        console.log(`✅ Template salvo: ${template.name}`);
        savedCount++;
      } catch (error: any) {
        console.error(`❌ Erro ao salvar template "${template.name}":`, error.message);
      }
    }

    console.log(`\n🎉 Concluído! ${savedCount}/${templates.length} templates salvos com sucesso\n`);
  } catch (error: any) {
    console.error("\n❌ Erro no processo:", error.message);
    process.exit(1);
  }
}

// Executar
const doctorId = process.argv[2];

if (!doctorId) {
  console.error("\n❌ Uso: npx tsx scripts/seed-templates.ts <doctor_id>\n");
  console.log("Para obter seu doctor_id:");
  console.log("1. Faça login na aplicação");
  console.log("2. Abra o console do navegador");
  console.log("3. Execute: (await supabase.auth.getUser()).data.user.id\n");
  process.exit(1);
}

console.log(`👤 Doctor ID: ${doctorId}`);
seedTemplates(doctorId);
