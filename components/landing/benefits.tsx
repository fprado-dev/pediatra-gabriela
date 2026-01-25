import { Clock, FileCheck, TrendingUp, Heart } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Economize 2 horas por dia",
    description:
      "Pare de digitar prontuários manualmente. A IA faz o trabalho pesado enquanto você foca no que importa: o paciente.",
    stat: "2h",
    statLabel: "economizadas/dia",
  },
  {
    icon: FileCheck,
    title: "Prontuários sem erros",
    description:
      "Transcrição automática elimina erros de digitação. Revisão inteligente garante que nenhum dado importante seja esquecido.",
    stat: "99%",
    statLabel: "de precisão",
  },
  {
    icon: TrendingUp,
    title: "Aumente sua produtividade",
    description:
      "Atenda mais pacientes no mesmo tempo ou saia mais cedo do consultório. Você escolhe como usar o tempo extra.",
    stat: "+40%",
    statLabel: "produtividade",
  },
  {
    icon: Heart,
    title: "Mais tempo com o paciente",
    description:
      "Menos tempo no computador significa mais atenção durante a consulta. Seus pacientes vão notar a diferença.",
    stat: "100%",
    statLabel: "de foco",
  },
];

export function Benefits() {
  return (
    <section className="py-20 md:py-32 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Benefícios que{" "}
            <span className="text-primary">transformam sua rotina</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Médicos que usam nossa plataforma relatam ganhos significativos 
            em produtividade e qualidade de vida.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`flex flex-col md:flex-row gap-6 p-6 md:p-8 bg-white rounded-2xl border shadow-sm ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Stat Card */}
              <div className="flex-shrink-0 w-full md:w-32 h-32 bg-primary/10 rounded-xl flex flex-col items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold text-primary">
                  {benefit.stat}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {benefit.statLabel}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{benefit.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
