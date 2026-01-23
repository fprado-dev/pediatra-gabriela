-- Criar tabela de templates de prescrição
CREATE TABLE IF NOT EXISTS prescription_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  
  -- Conteúdo estruturado (medicações)
  medications JSONB DEFAULT '[]'::jsonb,
  
  -- Texto livre (orientações gerais)
  instructions TEXT,
  warnings TEXT,
  
  -- Metadados
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo prescription na tabela consultations
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prescription TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_templates_doctor ON prescription_templates(doctor_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON prescription_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_favorite ON prescription_templates(doctor_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_templates_usage ON prescription_templates(doctor_id, usage_count DESC);

-- RLS (Row Level Security)
ALTER TABLE prescription_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios templates"
  ON prescription_templates
  FOR SELECT
  USING (auth.uid() = doctor_id);

CREATE POLICY "Usuários podem criar seus próprios templates"
  ON prescription_templates
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Usuários podem atualizar seus próprios templates"
  ON prescription_templates
  FOR UPDATE
  USING (auth.uid() = doctor_id);

CREATE POLICY "Usuários podem deletar seus próprios templates"
  ON prescription_templates
  FOR DELETE
  USING (auth.uid() = doctor_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_prescription_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prescription_templates_updated_at
  BEFORE UPDATE ON prescription_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_prescription_templates_updated_at();

-- Comentários
COMMENT ON TABLE prescription_templates IS 'Templates de prescrição reutilizáveis para médicos';
COMMENT ON COLUMN prescription_templates.medications IS 'Array JSON de medicações estruturadas';
COMMENT ON COLUMN prescription_templates.instructions IS 'Orientações gerais em texto livre';
COMMENT ON COLUMN prescription_templates.warnings IS 'Avisos e alertas importantes';
