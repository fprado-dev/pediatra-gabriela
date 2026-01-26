-- Create physical_exam_templates table
CREATE TABLE IF NOT EXISTS public.physical_exam_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name TEXT NOT NULL,
  system_label TEXT NOT NULL,
  age_group TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'both')),
  template_text TEXT NOT NULL,
  is_default BOOLEAN DEFAULT true,
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_system_name CHECK (
    system_name IN (
      'estado_geral',
      'coong',
      'cardiovascular',
      'respiratorio',
      'digestivo',
      'abdominal',
      'genitourinario',
      'neurologico',
      'pele_anexo',
      'locomotor'
    )
  ),
  CONSTRAINT valid_age_group CHECK (
    age_group IN (
      'newborn',      -- 0-28 dias
      'infant',       -- 1-12 meses
      'preschool',    -- 1-5 anos
      'school',       -- 6-12 anos
      'adolescent'    -- 13-18 anos
    )
  )
);

-- Create indexes
CREATE INDEX idx_physical_exam_templates_system ON physical_exam_templates(system_name);
CREATE INDEX idx_physical_exam_templates_age ON physical_exam_templates(age_group);
CREATE INDEX idx_physical_exam_templates_sex ON physical_exam_templates(sex);
CREATE INDEX idx_physical_exam_templates_doctor ON physical_exam_templates(doctor_id);
CREATE INDEX idx_physical_exam_templates_default ON physical_exam_templates(is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.physical_exam_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public templates (doctor_id is NULL) are readable by all authenticated users
CREATE POLICY "Public templates are readable by authenticated users"
  ON public.physical_exam_templates
  FOR SELECT
  TO authenticated
  USING (doctor_id IS NULL);

-- Users can read their own custom templates
CREATE POLICY "Users can read their own templates"
  ON public.physical_exam_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Users can insert their own custom templates
CREATE POLICY "Users can insert their own templates"
  ON public.physical_exam_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id AND is_default = false);

-- Users can update their own custom templates
CREATE POLICY "Users can update their own templates"
  ON public.physical_exam_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id AND is_default = false);

-- Users can delete their own custom templates
CREATE POLICY "Users can delete their own templates"
  ON public.physical_exam_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_physical_exam_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_physical_exam_templates_timestamp
  BEFORE UPDATE ON public.physical_exam_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_physical_exam_templates_updated_at();
