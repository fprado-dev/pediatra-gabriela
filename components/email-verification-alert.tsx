"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationAlert() {
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkEmailVerification();
  }, []);

  const checkEmailVerification = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      setIsEmailVerified(!!user.email_confirmed_at);
    }
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setIsResending(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast.success("Email de confirmação enviado!", {
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

  if (isEmailVerified) return null;

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-900 dark:text-amber-400">
        Confirme seu email
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-300 space-y-2">
        <p>
          Para garantir a segurança da sua conta e ter acesso completo a todas as
          funcionalidades, confirme seu endereço de email.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={isResending}
            className="border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isResending ? "Enviando..." : "Reenviar Email"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
