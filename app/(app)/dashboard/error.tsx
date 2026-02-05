"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full border-yellow-200 bg-yellow-50/30">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Erro ao carregar dashboard
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Não conseguimos carregar seus dados no momento. Por favor, tente novamente.
          </p>

          <Button
            onClick={reset}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>

          {error.digest && (
            <p className="text-xs text-muted-foreground mt-4">
              Código do erro: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
