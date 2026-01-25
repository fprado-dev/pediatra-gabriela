"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Como funciona a transcrição de áudio?",
    answer:
      "Você grava a consulta diretamente no app ou faz upload de um arquivo de áudio. Nossa IA processa o áudio, transcreve para texto e extrai automaticamente os dados clínicos relevantes como queixa principal, anamnese, exame físico e diagnóstico.",
  },
  {
    question: "Meus dados e dos meus pacientes estão seguros?",
    answer:
      "Sim! Utilizamos criptografia de ponta a ponta, servidores seguros e estamos em total conformidade com a LGPD (Lei Geral de Proteção de Dados). Seus dados nunca são compartilhados com terceiros e você tem controle total sobre eles.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Absolutamente. Não há fidelidade nem multa por cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente nas configurações da sua conta. Seus dados ficam disponíveis por 30 dias após o cancelamento.",
  },
  {
    question: "A plataforma funciona offline?",
    answer:
      "A gravação de áudio funciona offline e sincroniza automaticamente quando você reconectar à internet. Para processamento da IA e geração de PDFs, é necessária conexão com a internet.",
  },
  {
    question: "Qual a precisão da transcrição?",
    answer:
      "Nossa IA tem uma precisão média de 95-99% dependendo da qualidade do áudio. Recomendamos gravar em ambiente silencioso e falar de forma clara. Você sempre pode revisar e editar o texto antes de gerar o prontuário final.",
  },
  {
    question: "Posso personalizar o layout do prontuário?",
    answer:
      "Sim! Você pode adicionar sua logo, ajustar as seções exibidas e personalizar informações de cabeçalho e rodapé. Estamos constantemente adicionando mais opções de personalização.",
  },
  {
    question: "Vocês oferecem suporte técnico?",
    answer:
      "Sim! Oferecemos suporte por email para todos os planos e suporte prioritário com resposta em até 4 horas para planos Profissional e Clínica. Também temos uma base de conhecimento com tutoriais em vídeo.",
  },
  {
    question: "Funciona com qualquer especialidade médica?",
    answer:
      "Atualmente estamos focados em Pediatria, com vocabulário e campos otimizados para essa especialidade. Em breve expandiremos para outras áreas como Clínica Geral e Ginecologia.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas{" "}
            <span className="text-primary">frequentes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre a plataforma. 
            Não encontrou o que procura? Entre em contato!
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Ainda tem dúvidas?
          </p>
          <a
            href="mailto:contato@pediatragabrielamarinho.com.br"
            className="text-primary font-medium hover:underline"
          >
            Fale com a gente →
          </a>
        </div>
      </div>
    </section>
  );
}
