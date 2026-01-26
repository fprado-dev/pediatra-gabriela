"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";

interface QuickPatientFormProps {
  onSuccess: (patientId: string, patientName: string) => void;
  onCancel: () => void;
}

export function QuickPatientForm({
  onSuccess,
  onCancel,
}: QuickPatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    sex: "female" as "male" | "female",
    cpf: "",
    phone: "",
    responsible_name: "",
    responsible_cpf: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações básicas
    if (
      !formData.full_name ||
      !formData.date_of_birth ||
      !formData.cpf ||
      !formData.phone ||
      !formData.responsible_name ||
      !formData.responsible_cpf
    ) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Buscar o ID do médico logado
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Criar paciente com campos mínimos obrigatórios
      const { data: patient, error: createError } = await supabase
        .from("patients")
        .insert({
          doctor_id: user.id,
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth,
          sex: formData.sex,
          cpf: formData.cpf,
          phone: formData.phone,
          responsible_name: formData.responsible_name,
          responsible_cpf: formData.responsible_cpf,
        })
        .select()
        .single();

      if (createError) {
        console.error("Supabase error:", createError);
        throw createError;
      }

      onSuccess(patient.id, patient.full_name);
    } catch (err: any) {
      console.error("Error creating patient:", err);
      setError(err.message || "Erro ao cadastrar paciente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">
          Nome Completo <span className="text-red-500">*</span>
        </Label>
        <Input
          id="full_name"
          value={formData.full_name}
          onChange={(e) =>
            setFormData({ ...formData, full_name: e.target.value })
          }
          placeholder="Nome completo do paciente"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">
            Data de Nascimento <span className="text-red-500">*</span>
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">
            Sexo <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.sex}
            onValueChange={(value: "male" | "female") =>
              setFormData({ ...formData, sex: value })
            }
          >
            <SelectTrigger id="sex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="male">Masculino</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">
          CPF do Paciente <span className="text-red-500">*</span>
        </Label>
        <Input
          id="cpf"
          value={formData.cpf}
          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
          placeholder="000.000.000-00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Telefone <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(00) 00000-0000"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsible_name">
          Nome do Responsável <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsible_name"
          value={formData.responsible_name}
          onChange={(e) =>
            setFormData({ ...formData, responsible_name: e.target.value })
          }
          placeholder="Nome do responsável legal"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsible_cpf">
          CPF do Responsável <span className="text-red-500">*</span>
        </Label>
        <Input
          id="responsible_cpf"
          value={formData.responsible_cpf}
          onChange={(e) =>
            setFormData({ ...formData, responsible_cpf: e.target.value })
          }
          placeholder="000.000.000-00"
          required
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Cadastro Rápido:</strong> Dados complementares (endereço,
          alergias, histórico médico) podem ser adicionados posteriormente no
          perfil do paciente.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar e Continuar
        </Button>
      </div>
    </form>
  );
}
