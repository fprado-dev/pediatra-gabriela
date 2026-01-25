import {
  Mic,
  Brain,
  FileText,
  Pill,
  Users,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Gravação Inteligente",
    description:
      "Grave a consulta diretamente no app ou faça upload de áudios existentes. Compatível com qualquer formato.",
  },
  {
    icon: Brain,
    title: "IA que Entende Medicina",
    description:
      "Modelo treinado para extrair automaticamente queixa, anamnese, exame físico, diagnóstico e conduta.",
  },
  {
    icon: FileText,
    title: "Prontuário em PDF",
    description:
      "Gere PDFs profissionais prontos para imprimir ou enviar, com layout personalizado e sua logo.",
  },
  {
    icon: Pill,
    title: "Receitas Médicas",
    description:
      "Crie receitas completas com medicamentos, posologia, orientações e alertas de forma estruturada.",
  },
  {
    icon: Users,
    title: "Gestão de Pacientes",
    description:
      "Cadastro completo com histórico médico, alergias, medicações atuais e todas as consultas anteriores.",
  },
  {
    icon: Shield,
    title: "Segurança & LGPD",
    description:
      "Dados criptografados, servidores no Brasil e total conformidade com a Lei Geral de Proteção de Dados.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="text-primary">otimizar seu consultório</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ferramentas pensadas por pediatras, para pediatras. 
            Simplicidade e eficiência em cada funcionalidade.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
