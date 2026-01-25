import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Play, Sparkles } from "lucide-react";

const highlights = [
  "Teste grátis por 14 dias",
  "Sem cartão de crédito",
  "Conforme LGPD",
];

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 -z-10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Powered by Inteligência Artificial
          </Badge>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Transforme consultas em{" "}
            <span className="text-primary relative">
              prontuários completos
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 10C50 4 150 2 298 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-primary/40"
                />
              </svg>
            </span>{" "}
            em minutos
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Grave ou envie o áudio da consulta e deixe a IA extrair automaticamente 
            queixa principal, anamnese, diagnóstico e prescrição. 
            Economize até <strong>2 horas por dia</strong>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              asChild
            >
              <a href="#waitlist">
                Começar Gratuitamente
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-8 py-6"
              asChild
            >
              <a href="#how-it-works">
                <Play className="h-4 w-4 mr-2" />
                Ver como funciona
              </a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image/Mockup */}
        <div className="mt-16 md:mt-20 relative">
          <div className="relative mx-auto max-w-4xl">
            {/* Browser Frame */}
            <div className="bg-white rounded-xl shadow-2xl border overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md px-3 py-1 text-xs text-muted-foreground border text-center">
                    app.pediatragabrielamarinho.com.br
                  </div>
                </div>
              </div>
              {/* Screenshot Placeholder */}
              <div className="aspect-[16/9] bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                <div className="text-center p-8">
                  <Image
                    src="/full-logo.png"
                    alt="Pediatra Gabriela App"
                    width={200}
                    height={80}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <p className="text-muted-foreground text-sm">
                    Interface intuitiva para gerenciar consultas pediátricas
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -left-4 md:-left-12 top-1/4 bg-white rounded-lg shadow-lg p-4 border hidden md:block animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transcrição</p>
                  <p className="text-sm font-semibold">Concluída!</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 md:-right-12 top-1/3 bg-white rounded-lg shadow-lg p-4 border hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IA extraiu</p>
                  <p className="text-sm font-semibold">8 campos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
