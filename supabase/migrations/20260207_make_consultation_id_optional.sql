-- Tornar consultation_id opcional em medical_certificates para permitir
-- geração de atestados sem vínculo obrigatório com uma consulta específica

-- Adicionar coluna prescription_data se não existir (pode já existir)
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS prescription_data JSONB;

-- Tornar consultation_id opcional em medical_certificates
ALTER TABLE medical_certificates 
ALTER COLUMN consultation_id DROP NOT NULL;

-- Adicionar índice para buscar certificados por paciente e médico diretamente
CREATE INDEX IF NOT EXISTS idx_medical_certificates_patient_doctor 
ON medical_certificates(patient_id, doctor_id);

-- Comentário explicativo
COMMENT ON COLUMN medical_certificates.consultation_id IS 
'Consulta associada ao atestado (opcional - pode ser NULL se gerado sem consulta específica)';
