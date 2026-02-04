-- Adicionar campos adicionais aos templates de prescrição
-- Mantendo instructions e warnings existentes por compatibilidade

ALTER TABLE prescription_templates 
ADD COLUMN IF NOT EXISTS orientations TEXT,
ADD COLUMN IF NOT EXISTS alert_signs TEXT,
ADD COLUMN IF NOT EXISTS prevention TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Comentários
COMMENT ON COLUMN prescription_templates.orientations IS 'Orientações de cuidado, alimentação, repouso';
COMMENT ON COLUMN prescription_templates.alert_signs IS 'Sinais de alerta - quando procurar atendimento imediato';
COMMENT ON COLUMN prescription_templates.prevention IS 'Como prevenir recorrências ou complicações';
COMMENT ON COLUMN prescription_templates.notes IS 'Anotações adicionais do médico';
