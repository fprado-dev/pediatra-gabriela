-- Seed physical exam templates
-- Templates are organized by system, age group, and sex

-- ============================================================================
-- ESTADO GERAL
-- ============================================================================

-- Newborn (0-28 days) - Both sexes
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('estado_geral', 'Estado Geral', 'newborn', 'both', 
'Recém-nascido em bom estado geral, ativo e reativo. Hidratado, corado, acianótico, anictérico. Eupneico em ar ambiente. FC: ___ bpm, FR: ___ irpm, Tax: ___°C, Peso: ___ g. Perímetro cefálico: ___ cm, Perímetro torácico: ___ cm. Reflexos primitivos presentes e simétricos.', 
true);

-- Infant (1-12 months) - Both sexes
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('estado_geral', 'Estado Geral', 'infant', 'both',
'Lactente em bom estado geral, ativo e reativo. Hidratado, corado, acianótico, anictérico. Eupneico em ar ambiente. FC: ___ bpm, FR: ___ irpm, Tax: ___°C, Peso: ___ kg, Altura: ___ cm, PC: ___ cm. Desenvolvimento neuropsicomotor adequado para a idade.',
true);

-- Preschool (1-5 years) - Both sexes
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('estado_geral', 'Estado Geral', 'preschool', 'both',
'Pré-escolar em bom estado geral, ativo, corado, hidratado, acianótico, anictérico. Eupneico em ar ambiente. FC: ___ bpm, FR: ___ irpm, Tax: ___°C, PA: ___x___ mmHg, Peso: ___ kg, Altura: ___ cm. Desenvolvimento adequado para a idade.',
true);

-- School (6-12 years) - Both sexes
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('estado_geral', 'Estado Geral', 'school', 'both',
'Escolar em bom estado geral, ativo, corado, hidratado, acianótico, anictérico. Eupneico em ar ambiente. FC: ___ bpm, FR: ___ irpm, Tax: ___°C, PA: ___x___ mmHg, Peso: ___ kg, Altura: ___ cm, IMC: ___.',
true);

-- Adolescent - Male
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('estado_geral', 'Estado Geral', 'adolescent', 'male',
'Adolescente masculino em bom estado geral, corado, hidratado, acianótico, anictérico. Eupneico em ar ambiente. FC: ___ bpm, FR: ___ irpm, Tax: ___°C, PA: ___x___ mmHg, Peso: ___ kg, Altura: ___ cm, IMC: ___. Tanner genital: G___, Tanner piloso: P___.',
true);

-- Adolescent - Female
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('estado_geral', 'Estado Geral', 'adolescent', 'female',
'Adolescente feminina em bom estado geral, corada, hidratada, acianótica, anictérica. Eupneica em ar ambiente. FC: ___ bpm, FR: ___ irpm, Tax: ___°C, PA: ___x___ mmHg, Peso: ___ kg, Altura: ___ cm, IMC: ___. Tanner mamário: M___, Tanner piloso: P___. Menarca: ___.',
true);

-- ============================================================================
-- COONG (Cabeça, Olhos, Ouvidos, Nariz, Garganta)
-- ============================================================================

-- Newborn
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('coong', 'COONG', 'newborn', 'both',
'Crânio: normocefálico, fontanelas anterior e posterior normotensas, suturas pérvias. Olhos: pupilas isocóricas e fotorreagentes, reflexo vermelho presente bilateralmente. Orelhas: pavilhões auriculares de implantação normal, condutos auditivos externos pérvios. Nariz: narinas pérvias, sem secreções. Orofaringe: palato íntegro, mucosas coradas e hidratadas.',
true);

-- Infant
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('coong', 'COONG', 'infant', 'both',
'Crânio: normocefálico, fontanela anterior normotensa (___cm), suturas pérvias. Olhos: conjuntivas coradas, escleras anictéricas, pupilas isocóricas e fotorreagentes. Orelhas: sem alterações, membrana timpânica íntegra bilateralmente. Nariz: fossas nasais pérvias, sem secreções. Orofaringe: mucosas coradas e úmidas, orofaringe sem hiperemia, amígdalas grau ___/4.',
true);

-- Preschool & School
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('coong', 'COONG', 'preschool', 'both',
'Crânio: normocefálico. Olhos: conjuntivas coradas, escleras anictéricas, pupilas isocóricas e fotorreagentes. Orelhas: sem alterações, membrana timpânica íntegra bilateralmente. Nariz: fossas nasais pérvias, mucosa nasal sem alterações. Orofaringe: mucosas coradas e úmidas, orofaringe sem hiperemia, amígdalas grau ___/4. Dentição: ___ dentes.',
true),
('coong', 'COONG', 'school', 'both',
'Crânio: normocefálico. Olhos: conjuntivas coradas, escleras anictéricas, pupilas isocóricas e fotorreagentes, movimentação ocular preservada. Orelhas: sem alterações, membrana timpânica íntegra bilateralmente, sem otalgia. Nariz: fossas nasais pérvias, mucosa nasal normocorada. Orofaringe: mucosas coradas e úmidas, orofaringe sem hiperemia, amígdalas grau ___/4. Dentição permanente em evolução.',
true);

-- Adolescent
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('coong', 'COONG', 'adolescent', 'both',
'Crânio: normocefálico. Olhos: acuidade visual preservada, conjuntivas coradas, escleras anictéricas, pupilas isocóricas e fotorreagentes. Orelhas: pavilhões auriculares normais, membrana timpânica íntegra bilateralmente. Nariz: fossas nasais pérvias, septo nasal centrado, mucosa nasal normocorada. Orofaringe: mucosas coradas e úmidas, orofaringe sem alterações, amígdalas grau ___/4.',
true);

-- ============================================================================
-- APARELHO CARDIOVASCULAR
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('cardiovascular', 'Aparelho Cardiovascular', 'newborn', 'both',
'Precórdio: ictus cordis não palpável. Bulhas cardíacas rítmicas e normofonéticas em 2 tempos, sem sopros. Pulsos periféricos palpáveis e simétricos. Tempo de enchimento capilar < 2 segundos. FC: ___ bpm.',
true),
('cardiovascular', 'Aparelho Cardiovascular', 'infant', 'both',
'Precórdio: ictus cordis palpável no 4º-5º espaço intercostal esquerdo na linha hemiclavicular. Bulhas cardíacas rítmicas e normofonéticas em 2 tempos, sem sopros. Pulsos periféricos presentes e simétricos. Tempo de enchimento capilar < 2 segundos. FC: ___ bpm.',
true),
('cardiovascular', 'Aparelho Cardiovascular', 'preschool', 'both',
'Precórdio: ictus cordis visível e palpável no 5º espaço intercostal esquerdo na linha hemiclavicular. Bulhas cardíacas rítmicas e normofonéticas em 2 tempos, sem sopros audíveis. Pulsos periféricos presentes, simétricos e amplos. Tempo de enchimento capilar < 2 segundos. FC: ___ bpm.',
true),
('cardiovascular', 'Aparelho Cardiovascular', 'school', 'both',
'Precórdio: ictus cordis palpável no 5º espaço intercostal esquerdo na linha hemiclavicular. Bulhas cardíacas rítmicas e normofonéticas em 2 tempos, sem sopros. Ausência de frêmitos. Pulsos periféricos presentes e simétricos. Perfusão periférica adequada. FC: ___ bpm, PA: ___x___ mmHg.',
true),
('cardiovascular', 'Aparelho Cardiovascular', 'adolescent', 'both',
'Precórdio: ictus cordis visível e palpável no 5º espaço intercostal esquerdo na linha hemiclavicular. Bulhas cardíacas rítmicas e normofonéticas em 2 tempos, sem sopros ou extrassístoles. Ausência de frêmitos. Pulsos periféricos amplos, rítmicos e simétricos. Perfusão periférica preservada. FC: ___ bpm, PA: ___x___ mmHg.',
true);

-- ============================================================================
-- APARELHO RESPIRATÓRIO
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('respiratorio', 'Aparelho Respiratório', 'newborn', 'both',
'Tórax: simétrico, expansibilidade preservada. Ausculta pulmonar: murmúrio vesicular presente bilateralmente, sem ruídos adventícios. Eupneico em ar ambiente. FR: ___ irpm. Ausência de tiragem subcostal ou batimento de asa de nariz.',
true),
('respiratorio', 'Aparelho Respiratório', 'infant', 'both',
'Tórax: simétrico, expansibilidade preservada. Ausculta pulmonar: murmúrio vesicular presente e simétrico bilateralmente, sem ruídos adventícios. Eupneico em ar ambiente. FR: ___ irpm. Ausência de retrações intercostais ou tiragens.',
true),
('respiratorio', 'Aparelho Respiratório', 'preschool', 'both',
'Tórax: simétrico, expansibilidade normal. Ausculta pulmonar: murmúrio vesicular universalmente audível, sem ruídos adventícios. Eupneico em ar ambiente. FR: ___ irpm. Ausência de sinais de desconforto respiratório.',
true),
('respiratorio', 'Aparelho Respiratório', 'school', 'both',
'Tórax: simétrico, expansibilidade preservada bilateralmente. Ausculta pulmonar: murmúrio vesicular presente e simétrico em ambos hemitóraces, sem ruídos adventícios. Eupneico em ar ambiente. FR: ___ irpm. SpO2: ___% em ar ambiente.',
true),
('respiratorio', 'Aparelho Respiratório', 'adolescent', 'both',
'Tórax: configuração normal, expansibilidade simétrica. Ausculta pulmonar: murmúrio vesicular fisiológico presente bilateralmente, sem ruídos adventícios. Sons respiratórios normais. Eupneico em ar ambiente. FR: ___ irpm. SpO2: ___% em ar ambiente.',
true);

-- ============================================================================
-- APARELHO DIGESTIVO
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('digestivo', 'Aparelho Digestivo', 'newborn', 'both',
'Boca: mucosas coradas e úmidas, sucção eficaz, palato íntegro. Abdome: plano, flácido, sem visceromegalias. Ruídos hidroaéreos presentes. Coto umbilical em involução, sem sinais flogísticos. Ânus pérvio, eliminação de mecônio.',
true),
('digestivo', 'Aparelho Digestivo', 'infant', 'both',
'Boca: mucosas coradas e úmidas. Abdome: flácido, depressível, indolor à palpação superficial e profunda. Fígado palpável a ___ cm do rebordo costal direito. Baço não palpável. Ruídos hidroaéreos presentes e normais. Sem massas ou visceromegalias.',
true),
('digestivo', 'Aparelho Digestivo', 'preschool', 'both',
'Boca: mucosas coradas e úmidas. Abdome: plano, flácido, depressível, indolor à palpação. Fígado palpável a ___ cm do rebordo costal direito. Baço não palpável. Ruídos hidroaéreos presentes e normais. Sem massas ou organomegalias. Cicatriz umbilical sem alterações.',
true),
('digestivo', 'Aparelho Digestivo', 'school', 'both',
'Abdome: plano, flácido, depressível, indolor à palpação superficial e profunda. Fígado não palpável. Baço não palpável. Ruídos hidroaéreos presentes e normais. Sem massas, visceromegalias ou pontos dolorosos. Timpanismo preservado à percussão.',
true),
('digestivo', 'Aparelho Digestivo', 'adolescent', 'both',
'Abdome: plano, flácido, depressível, indolor à palpação superficial e profunda. Ausência de visceromegalias. Fígado e baço não palpáveis. Ruídos hidroaéreos presentes e normais. Sem massas ou pontos dolorosos. Sinal de Blumberg negativo. Sinal de Murphy negativo.',
true);

-- ============================================================================
-- APARELHO ABDOMINAL (Complementar ao Digestivo)
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('abdominal', 'Aparelho Abdominal', 'newborn', 'both',
'Abdome: globoso, flácido, sem distensão. Ausência de hérnias inguinais ou umbilicais. Região umbilical sem sinais flogísticos.',
true),
('abdominal', 'Aparelho Abdominal', 'infant', 'both',
'Abdome: levemente globoso, flácido, sem distensão. Ausência de hérnias inguinais ou umbilicais. Região inguinal sem linfonodomegalias.',
true),
('abdominal', 'Aparelho Abdominal', 'preschool', 'both',
'Abdome: sem distensão, ausência de hérnias. Região inguinal sem alterações. Sem sinais de irritação peritoneal.',
true),
('abdominal', 'Aparelho Abdominal', 'school', 'both',
'Abdome: sem distensão ou abaulamentos. Ausência de hérnias inguinais, umbilicais ou epigástricas. Sem sinais de irritação peritoneal. Região inguinal sem linfonodomegalias.',
true),
('abdominal', 'Aparelho Abdominal', 'adolescent', 'both',
'Abdome: sem distensão, circulação colateral ou abaulamentos. Ausência de hérnias. Sem sinais de irritação peritoneal. Região inguinal sem alterações.',
true);

-- ============================================================================
-- APARELHO GENITOURINÁRIO
-- ============================================================================

-- Newborn - Male
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'newborn', 'male',
'Genitália masculina: testículos tópicos bilateralmente, pênis sem alterações, meato uretral tópico e pérvio. Diurese presente. Ânus pérvio, tônus esfincteriano preservado.',
true);

-- Newborn - Female
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'newborn', 'female',
'Genitália feminina: grandes e pequenos lábios sem alterações, meato uretral tópico, hímen presente. Diurese presente. Ânus pérvio, tônus esfincteriano preservado.',
true);

-- Infant - Male
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'infant', 'male',
'Genitália masculina: testículos tópicos em bolsa escrotal, pênis sem alterações, prepúcio ___ (fimose fisiológica/retrátil). Diurese presente e normal.',
true);

-- Infant - Female
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'infant', 'female',
'Genitália feminina: sem alterações anatômicas. Diurese presente e normal.',
true);

-- Preschool/School - Male
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'preschool', 'male',
'Genitália masculina: testículos tópicos em bolsa escrotal, desenvolvimento adequado para idade. Ausência de hérnias inguino-escrotais. Diurese normal.',
true),
('genitourinario', 'Aparelho Genitourinário', 'school', 'male',
'Genitália masculina: desenvolvimento adequado para idade. Testículos tópicos e de tamanho normal. Ausência de varicocele ou hérnias. Diurese normal.',
true);

-- Preschool/School - Female
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'preschool', 'female',
'Genitália feminina: desenvolvimento adequado para idade. Sem alterações. Diurese normal.',
true),
('genitourinario', 'Aparelho Genitourinário', 'school', 'female',
'Genitália feminina: desenvolvimento adequado para idade. Sem alterações. Diurese normal.',
true);

-- Adolescent - Male
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'adolescent', 'male',
'Genitália masculina: Tanner G___, P___. Testículos tópicos, volume testicular: ___ ml (orquidômetro de Prader). Ausência de varicocele, hidrocele ou hérnias. Desenvolvimento puberal adequado.',
true);

-- Adolescent - Female
INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('genitourinario', 'Aparelho Genitourinário', 'adolescent', 'female',
'Desenvolvimento puberal: Tanner M___, P___. Menarca aos ___ anos. Ciclos menstruais: ___. Exame ginecológico: ___ (se indicado).',
true);

-- ============================================================================
-- APARELHO NEUROLÓGICO
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('neurologico', 'Aparelho Neurológico', 'newborn', 'both',
'Reflexos primitivos: sucção, busca, preensão palmar e plantar, Moro presentes e simétricos. Tônus muscular normal. Fontanela anterior normotensa. Movimentos espontâneos presentes e simétricos.',
true),
('neurologico', 'Aparelho Neurológico', 'infant', 'both',
'Desenvolvimento neuropsicomotor adequado para idade. Tônus muscular normal. Reflexos osteotendinosos presentes e simétricos. Fontanela anterior: ___ cm, normotensa. Marcos do desenvolvimento: ___.',
true),
('neurologico', 'Aparelho Neurológico', 'preschool', 'both',
'Consciente, ativo, responsivo. Desenvolvimento neuropsicomotor adequado para idade. Força muscular preservada. Coordenação motora adequada. Reflexos osteotendinosos presentes e simétricos. Marcha normal para idade.',
true),
('neurologico', 'Aparelho Neurológico', 'school', 'both',
'Consciente, orientado, cooperativo. Pares cranianos sem alterações. Força muscular grau V/V globalmente. Reflexos osteotendinosos presentes e simétricos (+++/4+). Coordenação motora preservada. Marcha normal. Equilíbrio adequado.',
true),
('neurologico', 'Aparelho Neurológico', 'adolescent', 'both',
'Consciente, orientado no tempo e espaço. Pares cranianos sem alterações. Força muscular grau V/V nos quatro membros. Sensibilidade tátil, dolorosa e térmica preservadas. Reflexos osteotendinosos presentes e simétricos (+++/4+). Reflexos cutâneo-plantares em flexão. Coordenação motora e equilíbrio preservados. Marcha normal.',
true);

-- ============================================================================
-- PELE E ANEXOS
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('pele_anexo', 'Pele e Anexos', 'newborn', 'both',
'Pele: corada, hidratada, turgor preservado. Presença de vernix caseoso/lanugo. Ausência de icterícia, cianose ou exantemas. Temperatura: ___°C.',
true),
('pele_anexo', 'Pele e Anexos', 'infant', 'both',
'Pele: corada, hidratada, turgor e elasticidade preservados. Ausência de lesões, exantemas ou petéquias. Unhas íntegras. Temperatura: ___°C.',
true),
('pele_anexo', 'Pele e Anexos', 'preschool', 'both',
'Pele: corada, hidratada, turgor e elasticidade normais. Ausência de lesões, exantemas, petéquias ou equimoses. Mucosas coradas. Unhas íntegras. Cabelos com boa implantação.',
true),
('pele_anexo', 'Pele e Anexos', 'school', 'both',
'Pele: íntegra, corada, hidratada, turgor preservado. Ausência de lesões elementares, exantemas ou equimoses. Fâneros sem alterações. Mucosas coradas e úmidas.',
true),
('pele_anexo', 'Pele e Anexos', 'adolescent', 'both',
'Pele: íntegra, hidratada, turgor preservado. Ausência de lesões, exantemas ou cianose. Presença de acne: ___ (se aplicável). Fâneros sem alterações. Mucosas coradas e úmidas.',
true);

-- ============================================================================
-- APARELHO LOCOMOTOR
-- ============================================================================

INSERT INTO public.physical_exam_templates (system_name, system_label, age_group, sex, template_text, is_default) VALUES
('locomotor', 'Aparelho Locomotor', 'newborn', 'both',
'Manobras de Ortolani e Barlow negativas. Membros simétricos, sem deformidades. Clavículas íntegras. Tônus muscular normal. Movimentos espontâneos presentes.',
true),
('locomotor', 'Aparelho Locomotor', 'infant', 'both',
'Membros superiores e inferiores simétricos, sem deformidades. Amplitude de movimento preservada. Tônus muscular normal. Sustento cefálico: ___. Postura adequada para idade.',
true),
('locomotor', 'Aparelho Locomotor', 'preschool', 'both',
'Coluna vertebral sem desvios. Membros sem deformidades, amplitude de movimento preservada. Marcha normal para idade. Ausência de claudicação. Força muscular adequada.',
true),
('locomotor', 'Aparelho Locomotor', 'school', 'both',
'Coluna vertebral: sem escoliose, cifose ou lordose patológicas. Membros superiores e inferiores sem deformidades ou limitações. Amplitude de movimento preservada. Marcha normal. Articulações sem sinais flogísticos.',
true),
('locomotor', 'Aparelho Locomotor', 'adolescent', 'both',
'Coluna vertebral: alinhamento normal, sem desvios. Membros superiores e inferiores proporcionais, sem deformidades. Articulações sem edema, hiperemia ou limitação de movimento. Amplitude articular preservada. Força muscular adequada. Marcha normal.',
true);
