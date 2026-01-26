-- Create medical_certificates table
CREATE TABLE IF NOT EXISTS public.medical_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL CHECK (
    certificate_type IN ('comparecimento', 'aptidao', 'afastamento', 'acompanhante')
  ),
  certificate_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_medical_certificates_consultation ON medical_certificates(consultation_id);
CREATE INDEX idx_medical_certificates_patient ON medical_certificates(patient_id);
CREATE INDEX idx_medical_certificates_doctor ON medical_certificates(doctor_id);
CREATE INDEX idx_medical_certificates_type ON medical_certificates(certificate_type);
CREATE INDEX idx_medical_certificates_date ON medical_certificates(generated_at DESC);

-- Enable RLS
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own certificates
CREATE POLICY "Users can read their own certificates"
  ON public.medical_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Users can insert their own certificates
CREATE POLICY "Users can insert their own certificates"
  ON public.medical_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = doctor_id);

-- Users can update their own certificates
CREATE POLICY "Users can update their own certificates"
  ON public.medical_certificates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = doctor_id)
  WITH CHECK (auth.uid() = doctor_id);

-- Users can delete their own certificates
CREATE POLICY "Users can delete their own certificates"
  ON public.medical_certificates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = doctor_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_medical_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medical_certificates_timestamp
  BEFORE UPDATE ON public.medical_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_certificates_updated_at();
