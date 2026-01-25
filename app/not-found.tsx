import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4">
      {/* Logo grande */}
      <div className="relative w-48 h-48 mb-8 animate-pulse">
        <Image
          src="/full-logo.png"
          alt="Pediatra Gabriela"
          fill
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Linha decorativa */}
      <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mb-8 rounded-full" />

      {/* 404 estilizado */}
      <h1 className="text-8xl font-bold text-primary/30 mb-4 tracking-tight">
        404
      </h1>

      {/* Mensagem */}
      <h2 className="text-2xl font-semibold mb-2 text-center">
        Página não encontrada
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-10 leading-relaxed">
        A página que você está procurando não existe ou foi movida. 
        Verifique o endereço digitado ou volte para o início.
      </p>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="min-w-[180px]">
          <Link href="/dashboard">
            <Home className="h-5 w-5 mr-2" />
            Ir para o Dashboard
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="min-w-[180px]" asChild>
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-xs text-muted-foreground">
          Precisa de ajuda?{" "}
          <a 
            href="mailto:suporte@pediatragabriela.com.br" 
            className="text-primary hover:underline font-medium"
          >
            Fale com o suporte
          </a>
        </p>
      </div>

      {/* Decoração de fundo */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
