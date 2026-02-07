-- Migration: Adicionar tipos de consulta, novos campos APS e sistema de histórico
-- Data: 2026-02-06
-- Descrição: Transição de SOAP para APS com tipos de consulta e histórico inteligente

-- 1. Adicionar novos campos (se não existirem)
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS consultation_type TEXT,
ADD COLUMN IF NOT EXISTS consultation_subtype TEXT,
ADD COLUMN IF NOT EXISTS hma TEXT,
ADD COLUMN IF NOT EXISTS history TEXT,
ADD COLUMN IF NOT EXISTS conduct TEXT,
ADD COLUMN IF NOT EXISTS family_history TEXT,
ADD COLUMN IF NOT EXISTS previous_consultations_summary JSONB DEFAULT '{\"consultations\": [], \"last_updated\": null}'::jsonb;

-- 2. IMPORTANTE: Campo history MANTIDO para informações complementares
-- NÃO migrar dados automaticamente - history e hma têm propósitos diferentes:
-- - HMA: História da moléstia atual (foco nos sintomas atuais)
-- - History: Informações de contexto complementares

-- 3. Setar tipo default para consultas existentes (se não tiverem tipo)
UPDATE consultations 
SET consultation_type = 'consulta_rotina' 
WHERE consultation_type IS NULL;

-- 5. Adicionar constraint para consultation_type (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_type_check'
  ) THEN
    ALTER TABLE consultations 
    ADD CONSTRAINT consultation_type_check 
    CHECK (consultation_type IN ('puericultura', 'urgencia_emergencia', 'consulta_rotina'));
  END IF;
END $$;

-- 6. Adicionar constraint para consultation_subtype (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'consultation_subtype_check'
  ) THEN
    ALTER TABLE consultations 
    ADD CONSTRAINT consultation_subtype_check 
    CHECK (
      (consultation_type != 'puericultura' AND consultation_subtype IS NULL) OR
      (consultation_type = 'puericultura' AND consultation_subtype IN (
        'prenatal', 
        'primeira_rn', 
        'mensal_1', 
        'mensal_2', 
        'mensal_3', 
        'mensal_4', 
        'mensal_5', 
        'mensal_6',
        'rotina_7_12'
      ))
    );
  END IF;
END $$;

-- 7. Tornar consultation_type NOT NULL (após setar valores default)
DO $$ 
BEGIN
  ALTER TABLE consultations 
  ALTER COLUMN consultation_type SET NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- 8. Adicionar índice para performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(consultation_type);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_status ON consultations(patient_id, status);

-- 9. Adicionar comentários para documentação
COMMENT ON COLUMN consultations.consultation_type IS 'Tipo de consulta: puericultura, urgencia_emergencia ou consulta_rotina';
COMMENT ON COLUMN consultations.consultation_subtype IS 'Subtipo de puericultura: prenatal, primeira_rn, mensal_1-6, rotina_7_12';
COMMENT ON COLUMN consultations.hma IS 'História da Moléstia Atual - foco na queixa atual (APS - Dados Subjetivos)';
COMMENT ON COLUMN consultations.history IS 'Informações complementares de contexto - rotina, hábitos (APS - Dados Subjetivos complementares)';
COMMENT ON COLUMN consultations.conduct IS 'Conduta: ações imediatas, exames, encaminhamentos (APS - Plano de Cuidado)';
COMMENT ON COLUMN consultations.family_history IS 'Histórico familiar relevante (APS - Dados Subjetivos)';
COMMENT ON COLUMN consultations.previous_consultations_summary IS 'Resumo das últimas consultas: {consultations: [{consultation_id, date, key_points[], diagnosis, auto_generated, edited_by_doctor}], last_updated}';
