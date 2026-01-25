"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function CTAWaitlist() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage("Por favor, insira seu email.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from("waitlist")
        .insert([{ email, name: name || null }]);

      if (error) {
        if (error.code === "23505") {
          setErrorMessage("Este email já está na lista de espera!");
        } else {
          throw error;
        }
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
      setName("");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setErrorMessage("Ocorreu um erro. Tente novamente.");
      setStatus("error");
    }
  };

  return (
    <section id="waitlist" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border shadow-xl p-8 md:p-12 text-center">
          {status === "success" ? (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Você está na lista! 🎉</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Obrigado pelo interesse! Entraremos em contato em breve com 
                novidades e acesso antecipado à plataforma.
              </p>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Vagas limitadas para acesso antecipado
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para transformar seu consultório?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Entre na lista de espera e seja um dos primeiros a experimentar 
                a plataforma. Acesso gratuito para os primeiros 50 médicos!
              </p>

              <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <Input
                    type="text"
                    placeholder="Seu nome (opcional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                  />
                  <Input
                    type="email"
                    placeholder="Seu melhor email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 flex-1"
                    required
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 px-8 bg-primary hover:bg-primary/90"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Entrar na Lista
                      </>
                    )}
                  </Button>
                </div>

                {status === "error" && errorMessage && (
                  <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
                )}

                <p className="text-xs text-muted-foreground">
                  Ao se cadastrar, você concorda com nossa{" "}
                  <a href="#" className="underline hover:text-foreground">
                    Política de Privacidade
                  </a>
                  . Não enviamos spam.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
