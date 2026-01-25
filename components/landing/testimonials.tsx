"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    quote:
      "Antes eu passava 30 minutos escrevendo cada prontuário. Agora são menos de 5 minutos. Isso mudou completamente minha rotina no consultório.",
    author: "Dra. Ana Paula",
    role: "Pediatra - São Paulo, SP",
    avatar: "AP",
  },
  {
    quote:
      "A precisão da transcrição é impressionante. Raramente preciso fazer correções. E a interface é muito intuitiva, aprendi a usar em minutos.",
    author: "Dr. Carlos Eduardo",
    role: "Pediatra - Rio de Janeiro, RJ",
    avatar: "CE",
  },
  {
    quote:
      "Finalmente consigo sair do consultório no horário. Minha qualidade de vida melhorou muito desde que comecei a usar a plataforma.",
    author: "Dra. Marina Silva",
    role: "Pediatra - Belo Horizonte, MG",
    avatar: "MS",
  },
  {
    quote:
      "O recurso de receitas médicas é fantástico. Já vem com as orientações estruturadas, é só revisar e imprimir. Muito prático!",
    author: "Dr. Roberto Lima",
    role: "Pediatra - Curitiba, PR",
    avatar: "RL",
  },
];

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que dizem os{" "}
            <span className="text-primary">pediatras</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Médicos de todo o Brasil já transformaram suas rotinas com nossa plataforma.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Quote Card */}
          <div className="bg-white rounded-2xl border shadow-lg p-8 md:p-12 text-center">
            <Quote className="h-10 w-10 text-primary/30 mx-auto mb-6" />
            
            <blockquote className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
              "{testimonials[currentIndex].quote}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                {testimonials[currentIndex].avatar}
              </div>
              <div className="text-left">
                <p className="font-semibold">{testimonials[currentIndex].author}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonials[currentIndex].role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-primary/30 hover:bg-primary/50"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t">
          {[
            { value: "50+", label: "Pediatras ativos" },
            { value: "2.000+", label: "Prontuários gerados" },
            { value: "4.8/5", label: "Avaliação média" },
            { value: "98%", label: "Taxa de satisfação" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
