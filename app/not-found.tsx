import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          <Image
            src="/full-logo.png"
            alt="Pediatra Gabriela"
            fill
            className="object-contain opacity-80"
            priority
          />
        </div>

        {/* 404 Number */}
        <div className="relative mb-6">
          <span className="text-[120px] font-bold text-primary/20 leading-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-primary/40" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold mb-3">
          Página não encontrada
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          A página que você está procurando pode ter sido removida, 
          teve seu nome alterado ou está temporariamente indisponível.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ir para o Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground mt-8">
          Se você acredita que isso é um erro, entre em contato com{" "}
          <a 
            href="mailto:suporte@pediatragabriela.com.br" 
            className="text-primary hover:underline"
          >
            nosso suporte
          </a>
        </p>
      </div>
    </div>
  );
}
