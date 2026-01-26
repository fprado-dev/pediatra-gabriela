-- Migration: Sistema de Timer de Consultas
-- Criado em: 2026-01-27

-- 1. Adicionar novo status "in_progress" aos appointments
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled'));

-- 2. Criar tabela de timers
CREATE TABLE consultation_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  
  -- Timestamps principais
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Pausas: array de objetos {started_at, resumed_at}
  pauses JSONB DEFAULT '[]'::jsonb,
  
  -- Durações em segundos
  total_duration_seconds INT,
  active_duration_seconds INT,
  
  -- Status do timer
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  
  -- Metadata
  started_from TEXT NOT NULL DEFAULT 'manual'
    CHECK (started_from IN ('appointment', 'manual')),
  notes TEXT,
  
  -- Timestamps de controle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX idx_timers_doctor_status ON consultation_timers(doctor_id, status);
CREATE INDEX idx_timers_patient ON consultation_timers(patient_id);
CREATE INDEX idx_timers_appointment ON consultation_timers(appointment_id);
CREATE INDEX idx_timers_consultation ON consultation_timers(consultation_id);
CREATE INDEX idx_timers_started_at ON consultation_timers(started_at DESC);
CREATE INDEX idx_timers_doctor_date ON consultation_timers(doctor_id, DATE(started_at));

-- 4. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_consultation_timers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_consultation_timers_updated_at
  BEFORE UPDATE ON consultation_timers
  FOR EACH ROW
  EXECUTE FUNCTION update_consultation_timers_updated_at();

-- 5. RLS (Row Level Security)
ALTER TABLE consultation_timers ENABLE ROW LEVEL SECURITY;

-- Policy: Médicos só podem ver seus próprios timers
CREATE POLICY "Doctors can view their own timers"
  ON consultation_timers FOR SELECT
  USING (doctor_id = auth.uid());

-- Policy: Médicos podem criar seus próprios timers
CREATE POLICY "Doctors can create their own timers"
  ON consultation_timers FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

-- Policy: Médicos podem atualizar seus próprios timers
CREATE POLICY "Doctors can update their own timers"
  ON consultation_timers FOR UPDATE
  USING (doctor_id = auth.uid());

-- Policy: Médicos podem deletar seus próprios timers
CREATE POLICY "Doctors can delete their own timers"
  ON consultation_timers FOR DELETE
  USING (doctor_id = auth.uid());

-- 6. Constraint: Apenas 1 timer ativo por médico
-- Comentado pois EXCLUDE não funciona bem com RLS
-- Validaremos isso na aplicação
-- CREATE UNIQUE INDEX idx_one_active_timer_per_doctor 
--   ON consultation_timers(doctor_id) 
--   WHERE status IN ('active', 'paused');

-- 7. Comentários nas colunas
COMMENT ON TABLE consultation_timers IS 'Registra sessões de tempo de atendimento das consultas';
COMMENT ON COLUMN consultation_timers.pauses IS 'Array de pausas: [{started_at: timestamp, resumed_at: timestamp}]';
COMMENT ON COLUMN consultation_timers.total_duration_seconds IS 'Duração total incluindo pausas (ended_at - started_at)';
COMMENT ON COLUMN consultation_timers.active_duration_seconds IS 'Duração ativa excluindo pausas';
COMMENT ON COLUMN consultation_timers.started_from IS 'Origem: appointment (de agendamento) ou manual (avulso)';
