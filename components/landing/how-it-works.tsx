import { Mic, Sparkles, Edit, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Mic,
    title: "Grave a Consulta",
    description:
      "Use o microfone do seu celular ou computador para gravar a consulta em tempo real. Ou faça upload de um áudio existente.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "IA Processa",
    description:
      "Nossa inteligência artificial transcreve o áudio e extrai automaticamente os dados clínicos relevantes.",
  },
  {
    number: "03",
    icon: Edit,
    title: "Revise e Ajuste",
    description:
      "Confira os dados extraídos e faça ajustes se necessário. Você tem controle total sobre o prontuário.",
  },
  {
    number: "04",
    icon: Download,
    title: "Gere o PDF",
    description:
      "Baixe o prontuário completo em PDF profissional e a receita médica estruturada. Pronto para imprimir!",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simples assim:{" "}
            <span className="text-primary">4 passos</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            De uma gravação de áudio a um prontuário completo em menos de 5 minutos.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Step Number Circle */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full" />
                  <div className="relative w-16 h-16 bg-white rounded-full border-2 border-primary flex items-center justify-center shadow-sm">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="#waitlist"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Experimente agora gratuitamente
            <span className="text-xl">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
