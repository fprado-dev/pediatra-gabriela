"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Phone, Mail, MapPin, Heart, Pill, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";

interface PatientFormProps {
  patient?: {
    id: string;
    full_name: string;
    date_of_birth: string;
    cpf: string;
    phone: string;
    email?: string;
    address?: string;
    medical_history?: string;
    allergies?: string;
    current_medications?: string;
    notes?: string;
    responsible_name?: string;
    responsible_cpf?: string;
    blood_type?: string;
    weight_kg?: number;
    height_cm?: number;
  };
  mode: "create" | "edit";
}

export function PatientForm({ patient, mode }: PatientFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: patient?.full_name || "",
    date_of_birth: patient?.date_of_birth || "",
    cpf: patient?.cpf || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    address: patient?.address || "",
    medical_history: patient?.medical_history || "",
    allergies: patient?.allergies || "",
    current_medications: patient?.current_medications || "",
    notes: patient?.notes || "",
    responsible_name: patient?.responsible_name || "",
    responsible_cpf: patient?.responsible_cpf || "",
    blood_type: patient?.blood_type || "",
    weight_kg: patient?.weight_kg?.toString() || "",
    height_cm: patient?.height_cm?.toString() || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    return cleanCPF.length === 11;
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    return cleaned
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validações
    if (!formData.full_name || !formData.date_of_birth || !formData.cpf || !formData.phone || !formData.responsible_cpf) {
      setError("Por favor, preencha todos os campos obrigatórios");
      setIsLoading(false);
      return;
    }

    if (!validateCPF(formData.cpf) || !validateCPF(formData.responsible_cpf)) {
      setError("CPF inválido");
      setIsLoading(false);
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email inválido");
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado");

      const patientData = {
        doctor_id: user.id,
        full_name: formData.full_name,
        date_of_birth: formData.date_of_birth,
        cpf: formData.cpf.replace(/\D/g, ""),
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email || null,
        address: formData.address || null,
        medical_history: formData.medical_history || null,
        allergies: formData.allergies || null,
        current_medications: formData.current_medications || null,
        notes: formData.notes || null,
        responsible_name: formData.responsible_name || null,
        responsible_cpf: formData.responsible_cpf.replace(/\D/g, ""),
        blood_type: formData.blood_type || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      };

      if (mode === "create") {
        const { error } = await supabase.from("patients").insert([patientData]);
        if (error) throw error;
        toast.success("Paciente cadastrado com sucesso!");
      } else {
        const { error } = await supabase
          .from("patients")
          .update(patientData)
          .eq("id", patient?.id);
        if (error) throw error;
        toast.success("Paciente atualizado com sucesso!");
      }

      router.push("/patients");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Erro ao salvar paciente");
      toast.error("Erro ao salvar paciente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Dados principais do paciente (obrigatórios)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              placeholder="Nome completo do paciente"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Data de Nascimento *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF do Paciente *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleChange("cpf", formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", formatPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  maxLength={15}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Rua, número, bairro, cidade, estado"
                className="pl-10"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Responsável */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Responsável Legal
          </CardTitle>
          <CardDescription>
            Dados do responsável pelo paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsible_name">Nome do Responsável</Label>
              <Input
                id="responsible_name"
                value={formData.responsible_name}
                onChange={(e) => handleChange("responsible_name", e.target.value)}
                placeholder="Nome completo"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_cpf">CPF do Responsável *</Label>
              <Input
                id="responsible_cpf"
                value={formData.responsible_cpf}
                onChange={(e) => handleChange("responsible_cpf", formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Médicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Informações Médicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
              <Input
                id="blood_type"
                value={formData.blood_type}
                onChange={(e) => handleChange("blood_type", e.target.value)}
                placeholder="A+, O-, etc"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => handleChange("weight_kg", e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height_cm">Altura (cm)</Label>
              <Input
                id="height_cm"
                type="number"
                step="0.01"
                value={formData.height_cm}
                onChange={(e) => handleChange("height_cm", e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleChange("allergies", e.target.value)}
              placeholder="Liste as alergias separadas por vírgula"
              rows={2}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_medications">Medicações Atuais</Label>
            <div className="relative">
              <Pill className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="current_medications"
                value={formData.current_medications}
                onChange={(e) => handleChange("current_medications", e.target.value)}
                placeholder="Liste as medicações em uso"
                className="pl-10"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">Histórico Médico</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="medical_history"
                value={formData.medical_history}
                onChange={(e) => handleChange("medical_history", e.target.value)}
                placeholder="Histórico de doenças, cirurgias, internações, etc"
                className="pl-10"
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Outras observações importantes"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Salvando..." : mode === "create" ? "Cadastrar Paciente" : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
