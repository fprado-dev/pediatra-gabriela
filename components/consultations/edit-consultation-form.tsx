"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Save, FileText, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TemplateSelectorModal } from "@/components/templates/template-selector-modal";

interface EditConsultationFormProps {
  consultation: any;
}

export function EditConsultationForm({ consultation }: EditConsultationFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const patient = consultation.patient as any;
  const patientWeight = patient?.weight_kg;

  // Estados do formulário
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formData, setFormData] = useState({
    chief_complaint: consultation.chief_complaint || "",
    history: consultation.history || "",
    physical_exam: consultation.physical_exam || "",
    diagnosis: consultation.diagnosis || "",
    plan: consultation.plan || "",
    prescription: consultation.prescription || "",
    notes: consultation.notes || "",
    weight_kg: consultation.weight_kg || null,
    height_cm: consultation.height_cm || null,
    head_circumference_cm: consultation.head_circumference_cm || null,
    development_notes: consultation.development_notes || "",
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("consultations")
        .update(formData)
        .eq("id", consultation.id);

      if (error) throw error;

      toast.success("Consulta atualizada com sucesso!");
      router.push(`/dashboard/consultations/${consultation.id}/preview`);
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar consulta");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertTemplate = (templateText: string, templateId: string) => {
    // Inserir template na prescrição
    const currentPrescription = formData.prescription || "";
    const newPrescription = currentPrescription
      ? `${currentPrescription}\n\n${templateText}`
      : templateText;

    handleChange("prescription", newPrescription);
    toast.success("Template inserido na prescrição!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/consultations/${consultation.id}/preview`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold">Editar Consulta</h1>
              <p className="text-muted-foreground mt-1">
                Paciente: {patient?.full_name}
                {patientWeight && ` • ${patientWeight}kg`}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Formulário */}
      <div className="space-y-6">
        {/* Queixa Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Queixa Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.chief_complaint}
              onChange={(e) => handleChange("chief_complaint", e.target.value)}
              placeholder="Motivo da consulta..."
              rows={2}
            />
          </CardContent>
        </Card>

        {/* História/Anamnese */}
        <Card>
          <CardHeader>
            <CardTitle>História / Anamnese</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.history}
              onChange={(e) => handleChange("history", e.target.value)}
              placeholder="Histórico detalhado dos sintomas..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Exame Físico */}
        <Card>
          <CardHeader>
            <CardTitle>Exame Físico</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.physical_exam}
              onChange={(e) => handleChange("physical_exam", e.target.value)}
              placeholder="Achados do exame clínico..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Diagnóstico */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.diagnosis}
              onChange={(e) => handleChange("diagnosis", e.target.value)}
              placeholder="Diagnóstico ou hipótese diagnóstica..."
            />
          </CardContent>
        </Card>

        {/* Prescrição (COM TEMPLATES!) */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Prescrição</CardTitle>
                <CardDescription>
                  Medicações e doses específicas
                  {patientWeight && ` (Dosagens calculadas para ${patientWeight}kg)`}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateModal(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.prescription}
              onChange={(e) => handleChange("prescription", e.target.value)}
              placeholder="Ex: 1. Dipirona 15mg/kg/dose, 6/6h se febre..."
              rows={8}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Plano Terapêutico */}
        <Card>
          <CardHeader>
            <CardTitle>Plano Terapêutico</CardTitle>
            <CardDescription>Orientações gerais e retorno</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.plan}
              onChange={(e) => handleChange("plan", e.target.value)}
              placeholder="Orientações, cuidados, sinais de alerta, retorno..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Medidas Pediátricas */}
        <Card>
          <CardHeader>
            <CardTitle>Medidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg || ""}
                  onChange={(e) => handleChange("weight_kg", parseFloat(e.target.value) || null)}
                  placeholder="25.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height_cm || ""}
                  onChange={(e) => handleChange("height_cm", parseFloat(e.target.value) || null)}
                  placeholder="130"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head">PC (cm)</Label>
                <Input
                  id="head"
                  type="number"
                  step="0.1"
                  value={formData.head_circumference_cm || ""}
                  onChange={(e) => handleChange("head_circumference_cm", parseFloat(e.target.value) || null)}
                  placeholder="52"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desenvolvimento */}
        <Card>
          <CardHeader>
            <CardTitle>Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.development_notes}
              onChange={(e) => handleChange("development_notes", e.target.value)}
              placeholder="Observações sobre desenvolvimento neuropsicomotor..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Notas Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Outras observações relevantes..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Link href={`/dashboard/consultations/${consultation.id}/preview`}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>

      {/* Modal de Templates */}
      <TemplateSelectorModal
        open={showTemplateModal}
        onOpenChange={setShowTemplateModal}
        onSelectTemplate={handleInsertTemplate}
        patientWeight={patientWeight}
      />
    </div>
  );
}
