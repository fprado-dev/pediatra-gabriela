import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    description: "Para começar a experimentar",
    price: "Grátis",
    period: "14 dias",
    features: [
      "Até 10 consultas/mês",
      "Transcrição de áudio",
      "Extração automática por IA",
      "Prontuários em PDF",
      "1 usuário",
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Profissional",
    description: "Para o consultório individual",
    price: "Em breve",
    period: "",
    features: [
      "Consultas ilimitadas",
      "Transcrição de áudio",
      "Extração automática por IA",
      "Prontuários em PDF",
      "Receitas médicas",
      "Gestão de pacientes",
      "Histórico completo",
      "Suporte prioritário",
    ],
    cta: "Entrar na Lista",
    highlighted: true,
  },
  {
    name: "Clínica",
    description: "Para equipes médicas",
    price: "Sob consulta",
    period: "",
    features: [
      "Tudo do Profissional",
      "Múltiplos usuários",
      "Relatórios gerenciais",
      "Integração com sistemas",
      "Onboarding dedicado",
      "SLA garantido",
    ],
    cta: "Fale Conosco",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos que cabem no seu{" "}
            <span className="text-primary">orçamento</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comece grátis e escolha o plano ideal quando estiver pronto.
            Sem surpresas, sem taxas escondidas.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-primary shadow-xl shadow-primary/10 scale-105"
                  : "shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground ml-1">
                    /{plan.period}
                  </span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <a href="#waitlist">{plan.cta}</a>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          Todos os planos incluem criptografia de dados, backup automático e conformidade com LGPD.
        </p>
      </div>
    </section>
  );
}
