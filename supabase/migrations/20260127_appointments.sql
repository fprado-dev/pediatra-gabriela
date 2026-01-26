-- Criar tabela de configurações de horário de atendimento
CREATE TABLE IF NOT EXISTS doctor_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6) NOT NULL, -- 0 = Domingo, 6 = Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Criar tabela de bloqueios de horário (férias, reuniões, etc)
CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INT DEFAULT 30 CHECK (duration_minutes > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  appointment_type TEXT DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'return', 'urgent')),
  notes TEXT,
  cancellation_reason TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Evitar agendamentos no passado
  CONSTRAINT no_past_appointments CHECK (
    appointment_date >= CURRENT_DATE OR
    (appointment_date = CURRENT_DATE AND appointment_time >= CURRENT_TIME)
  )
);

-- Índices para performance
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time) WHERE status != 'cancelled';
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_range ON appointments(doctor_id, appointment_date, status);

CREATE INDEX idx_doctor_schedule_doctor ON doctor_schedule(doctor_id, day_of_week);
CREATE INDEX idx_schedule_blocks_doctor ON schedule_blocks(doctor_id, start_datetime, end_datetime);

-- RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Policies para appointments
CREATE POLICY "Doctors can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = doctor_id);

-- Policies para doctor_schedule
CREATE POLICY "Doctors can view their own schedule"
  ON doctor_schedule FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can manage their own schedule"
  ON doctor_schedule FOR ALL
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Policies para schedule_blocks
CREATE POLICY "Doctors can view their own blocks"
  ON schedule_blocks FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can manage their own blocks"
  ON schedule_blocks FOR ALL
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

CREATE TRIGGER doctor_schedule_updated_at
  BEFORE UPDATE ON doctor_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Seed: Horário padrão de atendimento (Segunda a Sexta, 8h às 18h)
-- Será executado para o médico logado na primeira vez que acessar
-- Deixaremos isso para a aplicação criar na primeira vez
