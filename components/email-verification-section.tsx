"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailVerificationSectionProps {
  isEmailVerified: boolean;
  userEmail: string;
}

export function EmailVerificationSection({
  isEmailVerified,
  userEmail,
}: EmailVerificationSectionProps) {
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendVerificationEmail = async () => {
    if (!userEmail) return;

    setIsResending(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/settings`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Email enviado com sucesso!", {
        description: "Verifique sua caixa de entrada e spam.",
      });
    } catch (error) {
      toast.error("Erro ao enviar email", {
        description:
          error instanceof Error ? error.message : "Tente novamente mais tarde",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isEmailVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Email Verificado
          </CardTitle>
          <CardDescription className="text-green-700">
            Seu endereço de email foi confirmado com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-800">
            <Mail className="h-4 w-4" />
            <span>{userEmail}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          Verificação de Email
        </CardTitle>
        <CardDescription className="text-amber-700">
          Verifique seu email para maior segurança e poder recuperar sua senha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-amber-900">
            Um email de verificação será enviado para:
          </p>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-amber-200">
            <Mail className="h-4 w-4 text-amber-700" />
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
        </div>

        {emailSent && (
          <Alert className="border-blue-200 bg-blue-50">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              Email enviado! Verifique sua caixa de entrada e spam. O link é válido
              por 24 horas.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSendVerificationEmail}
            disabled={isResending || emailSent}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : emailSent ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Email Enviado
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email de Verificação
              </>
            )}
          </Button>

          {emailSent && (
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="border-amber-300"
            >
              Reenviar
            </Button>
          )}
        </div>

        <p className="text-xs text-amber-700">
          Nota: A verificação de email é opcional. Você pode continuar usando a
          plataforma normalmente sem verificar.
        </p>
      </CardContent>
    </Card>
  );
}
