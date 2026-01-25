import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserX, ArrowLeft, Plus } from "lucide-react";

export default function PatientNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-8 px-8">
          {/* Ícone */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <UserX className="h-10 w-10 text-muted-foreground" />
          </div>

          {/* Logo pequena */}
          <div className="relative w-16 h-16 mx-auto mb-6 opacity-50">
            <Image
              src="/small-logo.png"
              alt="Pediatra Gabriela"
              fill
              className="object-contain"
            />
          </div>

          {/* Mensagem */}
          <h1 className="text-xl font-bold mb-2">
            Paciente não encontrado
          </h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Este paciente não existe, foi removido ou você não tem permissão para acessá-lo.
          </p>

          {/* Ações */}
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/patients">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver todos os pacientes
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/patients/new">
                <Plus className="h-4 w-4 mr-2" />
                Novo paciente
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
