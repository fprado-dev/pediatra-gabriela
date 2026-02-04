-- Migration: Audio Hash and Reuse Tracking System
-- Criado em: 2026-02-03
-- Objetivo: Detectar e reutilizar áudios já processados

-- 1. Adicionar coluna audio_hash para detectar duplicatas
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS audio_hash TEXT;

-- 2. Adicionar coluna para rastrear consulta original
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS reused_from_consultation_id UUID 
REFERENCES consultations(id) ON DELETE SET NULL;

-- 3. Índice composto para busca rápida de duplicatas por médico
-- Este índice permite buscar rapidamente se um hash já existe para um médico específico
CREATE INDEX IF NOT EXISTS idx_consultations_audio_hash 
ON consultations(doctor_id, audio_hash) 
WHERE audio_hash IS NOT NULL;

-- 4. Índice para rastrear consultas derivadas/reutilizadas
-- Útil para queries como "quais consultas foram criadas a partir desta?"
CREATE INDEX IF NOT EXISTS idx_consultations_reused_from 
ON consultations(reused_from_consultation_id) 
WHERE reused_from_consultation_id IS NOT NULL;

-- 5. Comentários para documentação
COMMENT ON COLUMN consultations.audio_hash IS 
  'SHA-256 hash do arquivo de áudio para detectar duplicatas. Calculado no cliente e confirmado no servidor. Usado para buscar consultas existentes com o mesmo áudio dentro do escopo do médico.';

COMMENT ON COLUMN consultations.reused_from_consultation_id IS 
  'ID da consulta original se esta foi criada reaproveitando dados existentes. NULL se é uma consulta original (processada normalmente). Usado para rastreabilidade e analytics.';

-- 6. View para analytics de reuso (opcional, útil para dashboard)
CREATE OR REPLACE VIEW consultation_reuse_stats AS
SELECT 
  doctor_id,
  COUNT(*) FILTER (WHERE reused_from_consultation_id IS NOT NULL) as reused_count,
  COUNT(*) as total_consultations,
  ROUND(
    COUNT(*) FILTER (WHERE reused_from_consultation_id IS NOT NULL)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as reuse_percentage
FROM consultations
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY doctor_id;

COMMENT ON VIEW consultation_reuse_stats IS 
  'Estatísticas de reuso de consultas nos últimos 30 dias por médico. Útil para dashboard e analytics.';
