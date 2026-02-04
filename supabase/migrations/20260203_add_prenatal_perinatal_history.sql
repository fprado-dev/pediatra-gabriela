-- Migration: Adicionar campo de histórico gestacional/perinatal
-- Criado em: 2026-02-03
-- Objetivo: Capturar informações críticas sobre gestação/parto mencionadas pela mãe

-- Adicionar coluna para histórico gestacional/perinatal
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prenatal_perinatal_history TEXT;

-- Comentário explicativo
COMMENT ON COLUMN consultations.prenatal_perinatal_history IS 
'Histórico de gestação, parto e período perinatal mencionado pela mãe durante a consulta. 
Crítico para recém-nascidos e lactentes. Inclui: intercorrências gestacionais, tipo de parto, 
complicações perinatais, internações em UTI neonatal, etc.';
