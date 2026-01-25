"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw, Mail } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Ops! Algo deu errado</h1>
          <p className="text-muted-foreground mt-2">
            Encontramos um problema ao processar sua solicitação. 
            Não se preocupe, nossa equipe foi notificada.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error details (collapsible in production) */}
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium mb-1">Detalhes do erro:</p>
            <p className="text-xs text-muted-foreground font-mono break-all">
              {error.message || "Erro desconhecido"}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Código: <code className="font-mono">{error.digest}</code>
              </p>
            )}
          </div>

          {/* Suggestions */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">O que você pode fazer:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tente recarregar a página</li>
              <li>Verifique sua conexão com a internet</li>
              <li>Se o problema persistir, entre em contato conosco</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-3 w-full">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Ir para Início
              </a>
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
            <a href="mailto:suporte@pediatragabriela.com.br?subject=Erro na aplicação&body=Código do erro: ${error.digest || 'N/A'}">
              <Mail className="h-4 w-4 mr-2" />
              Contatar Suporte
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
