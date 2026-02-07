-- Migration: Adicionar coluna head_circumference_cm na tabela patients
-- Data: 2026-02-06
-- Descrição: Adiciona campo para armazenar perímetro cefálico do paciente

-- Adicionar coluna head_circumference_cm na tabela patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS head_circumference_cm NUMERIC(5,2);

-- Adicionar comentário para documentação
COMMENT ON COLUMN patients.head_circumference_cm IS 'Perímetro cefálico do paciente em centímetros (atualizado automaticamente durante consultas)';
