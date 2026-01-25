"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Stethoscope,
  Activity,
  Ruler,
  StickyNote,
  AlertCircle,
  TrendingUp,
  Scale,
  Baby,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

// Esquema de validação
const consultationSchema = z.object({
  chief_complaint: z.string().min(3, "Queixa principal é obrigatória (mínimo 3 caracteres)"),
  history: z.string().optional(),
  physical_exam: z.string().optional(),
  diagnosis: z.string().min(2, "Diagnóstico é obrigatório (mínimo 2 caracteres)"),
  plan: z.string().optional(),
  weight_kg: z.number().min(0.5).max(150).nullable().optional(),
  height_cm: z.number().min(30).max(200).nullable().optional(),
  head_circumference_cm: z.number().min(25).max(65).nullable().optional(),
  development_notes: z.string().optional(),
  notes: z.string().optional(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

interface PreviousMeasurement {
  id: string;
  consultation_date: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
}

interface EditConsultationFormProps {
  consultation: any;
  previousMeasurements?: PreviousMeasurement[];
}

export function EditConsultationForm({ consultation, previousMeasurements = [] }: EditConsultationFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isSaving, setIsSaving] = useState(false);

  const patient = Array.isArray(consultation.patient)
    ? consultation.patient[0]
    : consultation.patient;

  // Última consulta com medições
  const lastMeasurement = previousMeasurements.length > 0 ? previousMeasurements[0] : null;

  // Usar dados: 1) da consulta atual, 2) da última consulta, 3) do cadastro do paciente
  const defaultWeight = consultation.weight_kg || lastMeasurement?.weight_kg || patient?.weight_kg || null;
  const defaultHeight = consultation.height_cm || lastMeasurement?.height_cm || patient?.height_cm || null;
  const defaultHeadCirc = consultation.head_circumference_cm || lastMeasurement?.head_circumference_cm || null;

  // Determinar origem dos dados para exibir ao usuário
  const measurementSource = consultation.weight_kg 
    ? { type: "current", label: "desta consulta" }
    : lastMeasurement?.weight_kg
    ? { type: "previous", label: `da consulta de ${new Date(lastMeasurement.consultation_date).toLocaleDateString("pt-BR")}`, date: lastMeasurement.consultation_date }
    : patient?.weight_kg
    ? { type: "profile", label: "do cadastro do paciente" }
    : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      chief_complaint: consultation.chief_complaint || "",
      history: consultation.history || "",
      physical_exam: consultation.physical_exam || "",
      diagnosis: consultation.diagnosis || "",
      plan: consultation.plan || "",
      weight_kg: defaultWeight,
      height_cm: defaultHeight,
      head_circumference_cm: defaultHeadCirc,
      development_notes: consultation.development_notes || "",
      notes: consultation.notes || "",
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSaving(true);
    try {
      // Verificar se é a primeira edição (salvar versão original da IA)
      const shouldSaveOriginal = !consultation.original_ai_version;

      const updateData: any = {
        chief_complaint: data.chief_complaint,
        history: data.history || null,
        physical_exam: data.physical_exam || null,
        diagnosis: data.diagnosis,
        plan: data.plan || null,
        weight_kg: data.weight_kg || null,
        height_cm: data.height_cm || null,
        head_circumference_cm: data.head_circumference_cm || null,
        development_notes: data.development_notes || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Se primeira edição, salvar versão original
      if (shouldSaveOriginal) {
        updateData.original_ai_version = {
          chief_complaint: consultation.chief_complaint,
          history: consultation.history,
          physical_exam: consultation.physical_exam,
          diagnosis: consultation.diagnosis,
          plan: consultation.plan,
          weight_kg: consultation.weight_kg,
          height_cm: consultation.height_cm,
          head_circumference_cm: consultation.head_circumference_cm,
          development_notes: consultation.development_notes,
          notes: consultation.notes,
          saved_at: new Date().toISOString(),
        };
      }

      const { error } = await supabase
        .from("consultations")
        .update(updateData)
        .eq("id", consultation.id);

      if (error) throw error;

      toast.success("Consulta atualizada com sucesso!");
      router.push(`/consultations/${consultation.id}/preview`);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao atualizar consulta: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/consultations/${consultation.id}/preview`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Editar Consulta</h1>
            <p className="text-muted-foreground mt-1">
              Paciente: <span className="font-medium">{patient?.full_name}</span>
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados Clínicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados Clínicos
            </CardTitle>
            <CardDescription>
              Informações principais sobre a consulta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Queixa Principal */}
            <div className="space-y-2">
              <Label htmlFor="chief_complaint">
                Queixa Principal <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="chief_complaint"
                placeholder="Ex: Febre há 2 dias..."
                rows={3}
                {...register("chief_complaint")}
              />
              {errors.chief_complaint && (
                <p className="text-sm text-red-500">{errors.chief_complaint.message}</p>
              )}
            </div>

            {/* História/Anamnese */}
            <div className="space-y-2">
              <Label htmlFor="history">História Clínica / Anamnese</Label>
              <Textarea
                id="history"
                placeholder="Descreva a história clínica do paciente..."
                rows={8}
                {...register("history")}
              />
            </div>

            {/* Exame Físico */}
            <div className="space-y-2">
              <Label htmlFor="physical_exam">Exame Físico</Label>
              <Textarea
                id="physical_exam"
                placeholder="Descreva os achados do exame físico..."
                rows={6}
                {...register("physical_exam")}
              />
            </div>

            {/* Diagnóstico */}
            <div className="space-y-2">
              <Label htmlFor="diagnosis">
                Diagnóstico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="diagnosis"
                placeholder="Ex: Faringoamigdalite aguda"
                {...register("diagnosis")}
              />
              {errors.diagnosis && (
                <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
              )}
            </div>

            {/* Plano Terapêutico */}
            <div className="space-y-2">
              <Label htmlFor="plan">Plano Terapêutico</Label>
              <Textarea
                id="plan"
                placeholder="Descreva o plano de tratamento..."
                rows={6}
                {...register("plan")}
              />
            </div>

            </CardContent>
        </Card>

        {/* Dados Antropométricos - Destacado */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              Dados Antropométricos
            </CardTitle>
            <CardDescription>
              <span className="font-medium">Importante:</span> Registre as medidas atuais para acompanhamento do crescimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Alerta de último registro */}
            {measurementSource && measurementSource.type !== "current" && (
              <Alert className="bg-white border-primary/20">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <span className="font-medium">
                    Dados pré-preenchidos {measurementSource.label}:
                  </span>{" "}
                  {defaultWeight && <span>Peso: {defaultWeight}kg</span>}
                  {defaultWeight && defaultHeight && " • "}
                  {defaultHeight && <span>Altura: {defaultHeight}cm</span>}
                  {defaultHeadCirc && ` • P.C.: ${defaultHeadCirc}cm`}
                  <span className="text-yellow-600 ml-2 font-medium">
                    → Atualize com as medidas de hoje!
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {/* Histórico de medições anteriores */}
            {previousMeasurements.length > 0 && (
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  📊 Últimas medições registradas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {previousMeasurements.slice(0, 3).map((m) => (
                    <span 
                      key={m.id} 
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {new Date(m.consultation_date).toLocaleDateString("pt-BR")}:{" "}
                      {m.weight_kg}kg, {m.height_cm}cm
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Grid de Medidas - Destacado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 bg-white p-4 rounded-lg border">
                <Label htmlFor="weight_kg" className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Peso (kg) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="150"
                  placeholder="12.5"
                  className="text-lg font-medium h-12"
                  {...register("weight_kg", {
                    setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                  })}
                />
                {errors.weight_kg && (
                  <p className="text-sm text-red-500">{errors.weight_kg.message}</p>
                )}
              </div>

              <div className="space-y-2 bg-white p-4 rounded-lg border">
                <Label htmlFor="height_cm" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  Altura (cm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="height_cm"
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  placeholder="98.5"
                  className="text-lg font-medium h-12"
                  {...register("height_cm", {
                    setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                  })}
                />
                {errors.height_cm && (
                  <p className="text-sm text-red-500">{errors.height_cm.message}</p>
                )}
              </div>

              <div className="space-y-2 bg-white p-4 rounded-lg border">
                <Label htmlFor="head_circumference_cm" className="flex items-center gap-2">
                  <Baby className="h-4 w-4 text-muted-foreground" />
                  P. Cefálico (cm)
                </Label>
                <Input
                  id="head_circumference_cm"
                  type="number"
                  step="0.1"
                  min="25"
                  max="65"
                  placeholder="48.5"
                  className="text-lg font-medium h-12"
                  {...register("head_circumference_cm", {
                    setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                  })}
                />
                {errors.head_circumference_cm && (
                  <p className="text-sm text-red-500">
                    {errors.head_circumference_cm.message}
                  </p>
                )}
              </div>
            </div>

            {/* Desenvolvimento */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="development_notes">Notas de Desenvolvimento</Label>
              <Textarea
                id="development_notes"
                placeholder="Marcos do desenvolvimento, observações..."
                rows={4}
                className="bg-white"
                {...register("development_notes")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Observações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              placeholder="Notas adicionais, observações, lembretes..."
              rows={4}
              {...register("notes")}
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Link href={`/consultations/${consultation.id}/preview`}>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
