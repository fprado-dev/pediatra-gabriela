-- Adicionar campo is_open_template para templates da comunidade
ALTER TABLE prescription_templates 
ADD COLUMN is_open_template BOOLEAN DEFAULT false;

-- Atualizar RLS para permitir visualização de templates da comunidade
DROP POLICY IF EXISTS "Usuários podem ver seus próprios templates" ON prescription_templates;

CREATE POLICY "Usuários podem ver seus templates e templates da comunidade"
  ON prescription_templates
  FOR SELECT
  USING (auth.uid() = doctor_id OR is_open_template = true);

-- Index para performance em templates da comunidade
CREATE INDEX IF NOT EXISTS idx_templates_open ON prescription_templates(is_open_template) 
WHERE is_open_template = true;

-- Comentário
COMMENT ON COLUMN prescription_templates.is_open_template IS 'Se true, o template é visível para toda a comunidade. Se false, apenas para o criador.';
