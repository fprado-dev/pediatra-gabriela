"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Pill,
  Lightbulb,
  AlertTriangle,
  Shield,
  StickyNote,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Download,
  Loader2,
  BookMarked,
  FileText,
} from "lucide-react";
import { MedicationItem } from "./medication-item";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
}

interface PrescriptionData {
  medications: Medication[];
  orientations: string;
  alertSigns: string;
  prevention: string;
  notes: string;
  returnDays: number | null;
  bringExams: boolean;
  observeFeeding: boolean;
}

interface Patient {
  id: string;
  name: string;
  age: string | null;
  weight?: number;
  allergies?: string;
  currentMedications?: string;
}

interface ClinicalData {
  chiefComplaint?: string;
  diagnosis?: string;
  plan?: string;
}

interface Doctor {
  name: string;
  crm: string;
}

interface Template {
  id: string;
  name: string;
  medications: Medication[];
  orientations?: string;
  alert_signs?: string;
  prevention?: string;
  notes?: string;
}

interface PrescriptionFormProps {
  consultationId: string;
  patient: Patient;
  clinicalData: ClinicalData;
  existingPrescription?: PrescriptionData | null;
  doctor: Doctor;
  templates: Template[];
}

const defaultMedication: Medication = {
  id: crypto.randomUUID(),
  name: "",
  dosage: "",
  quantity: "",
  instructions: "",
};

export function PrescriptionForm({
  consultationId,
  patient,
  clinicalData,
  existingPrescription,
  doctor,
  templates,
}: PrescriptionFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Estado do formulário
  const [medications, setMedications] = useState<Medication[]>(
    existingPrescription?.medications || [{ ...defaultMedication }]
  );
  const [orientations, setOrientations] = useState(
    existingPrescription?.orientations || ""
  );
  const [alertSigns, setAlertSigns] = useState(
    existingPrescription?.alertSigns || ""
  );
  const [prevention, setPrevention] = useState(
    existingPrescription?.prevention || ""
  );
  const [notes, setNotes] = useState(existingPrescription?.notes || "");
  const [returnDays, setReturnDays] = useState<number | null>(
    existingPrescription?.returnDays || null
  );
  const [bringExams, setBringExams] = useState(
    existingPrescription?.bringExams || false
  );
  const [observeFeeding, setObserveFeeding] = useState(
    existingPrescription?.observeFeeding || false
  );

  // Funções de medicamentos
  const addMedication = () => {
    setMedications([...medications, { ...defaultMedication, id: crypto.randomUUID() }]);
  };

  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, [field]: value } : med
      )
    );
  };

  const removeMedication = (id: string) => {
    if (medications.length > 1) {
      setMedications(medications.filter((med) => med.id !== id));
    }
  };

  // Gerar seção com IA
  const generateSection = async (section: string) => {
    setIsGenerating(section);
    try {
      const response = await fetch("/api/prescriptions/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          patient: {
            age: patient.age,
            weight: patient.weight,
            allergies: patient.allergies,
            currentMedications: patient.currentMedications,
          },
          clinical: clinicalData,
          currentMedications: medications.filter((m) => m.name.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar com IA");
      }

      const data = await response.json();

      switch (section) {
        case "medications":
          if (data.medications?.length > 0) {
            setMedications(
              data.medications.map((m: any) => ({
                id: crypto.randomUUID(),
                name: m.name || "",
                dosage: m.dosage || "",
                quantity: m.quantity || "",
                instructions: m.instructions || "",
              }))
            );
          }
          break;
        case "orientations":
          setOrientations(data.content || "");
          break;
        case "alertSigns":
          setAlertSigns(data.content || "");
          break;
        case "prevention":
          setPrevention(data.content || "");
          break;
      }

      toast.success(`Seção gerada com IA!`);
    } catch (error) {
      console.error("Erro ao gerar seção:", error);
      toast.error("Erro ao gerar com IA. Tente novamente.");
    } finally {
      setIsGenerating(null);
    }
  };

  // Carregar template
  const loadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    if (template.medications?.length > 0) {
      setMedications(
        template.medications.map((m: any) => ({
          id: crypto.randomUUID(),
          name: m.name || "",
          dosage: m.dosage || "",
          quantity: m.quantity || "",
          instructions: m.instructions || "",
        }))
      );
    }
    if (template.orientations) setOrientations(template.orientations);
    if (template.alert_signs) setAlertSigns(template.alert_signs);
    if (template.prevention) setPrevention(template.prevention);
    if (template.notes) setNotes(template.notes);

    toast.success(`Template "${template.name}" carregado!`);
  };

  // Salvar como template
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    try {
      const { error } = await supabase.from("prescription_templates").insert({
        name: templateName,
        medications: medications.filter((m) => m.name.trim()),
        orientations,
        alert_signs: alertSigns,
        prevention,
        notes,
      });

      if (error) throw error;

      toast.success("Template salvo com sucesso!");
      setShowSaveTemplateDialog(false);
      setTemplateName("");
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar template");
    }
  };

  // Salvar receita
  const savePrescription = async () => {
    // Validar medicamentos
    const validMedications = medications.filter((m) => m.name.trim());
    if (validMedications.length === 0) {
      toast.error("Adicione pelo menos um medicamento");
      return;
    }

    setIsSaving(true);
    try {
      const prescriptionData: PrescriptionData = {
        medications: validMedications,
        orientations,
        alertSigns,
        prevention,
        notes,
        returnDays,
        bringExams,
        observeFeeding,
      };

      // Gerar texto formatado para o campo prescription
      const prescriptionText = formatPrescriptionText(prescriptionData);

      const { error } = await supabase
        .from("consultations")
        .update({
          prescription_data: prescriptionData,
          prescription: prescriptionText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultationId);

      if (error) throw error;

      toast.success("Receita salva com sucesso!");
      router.push(`/consultations/${consultationId}/preview`);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar receita");
    } finally {
      setIsSaving(false);
    }
  };

  // Formatar texto da receita
  const formatPrescriptionText = (data: PrescriptionData): string => {
    let text = "";

    // Medicamentos
    if (data.medications.length > 0) {
      text += "💊 USO ORAL:\n\n";
      data.medications.forEach((med, index) => {
        text += `${index + 1}) ${med.name} --- ${med.quantity}\n`;
        if (med.dosage) text += `   Dosagem: ${med.dosage}\n`;
        if (med.instructions) text += `   ${med.instructions}\n`;
        text += "\n";
      });
    }

    // Orientações
    if (data.orientations) {
      text += "\n💡 ORIENTAÇÕES:\n\n";
      text += data.orientations + "\n";
    }

    // Sinais de alerta
    if (data.alertSigns) {
      text += "\n⚠️ SINAIS DE ALERTA - PROCURAR ATENDIMENTO SE:\n\n";
      text += data.alertSigns + "\n";
    }

    // Prevenção
    if (data.prevention) {
      text += "\n🛡️ COMO PREVENIR:\n\n";
      text += data.prevention + "\n";
    }

    // Anotações
    if (data.notes || data.returnDays || data.bringExams || data.observeFeeding) {
      text += "\n📝 ANOTAÇÕES:\n\n";
      if (data.returnDays) text += `• Retornar em ${data.returnDays} dias\n`;
      if (data.bringExams) text += `• Levar resultados de exames\n`;
      if (data.observeFeeding) text += `• Observar aceitação alimentar\n`;
      if (data.notes) text += data.notes + "\n";
    }

    return text.trim();
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/consultations/${consultationId}/preview`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Criar Receita Médica</h1>
            <p className="text-muted-foreground">
              Paciente: <strong>{patient.name}</strong>
              {patient.age && ` (${patient.age})`}
              {patient.weight && ` • ${patient.weight}kg`}
            </p>
          </div>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <Select onValueChange={loadTemplate}>
            <SelectTrigger className="w-[200px]">
              <BookMarked className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Carregar template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Alergias */}
      {patient.allergies && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Alergias do Paciente</p>
            <p className="text-sm text-destructive/80">{patient.allergies}</p>
          </div>
        </div>
      )}

      {/* Diagnóstico */}
      {clinicalData.diagnosis && (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Diagnóstico:</p>
          <p className="font-medium">{clinicalData.diagnosis}</p>
        </div>
      )}

      <Separator />

      {/* Seção: Medicamentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medicamentos
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSection("medications")}
            disabled={isGenerating === "medications"}
          >
            {isGenerating === "medications" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Gerar com IA
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.map((med, index) => (
            <MedicationItem
              key={med.id}
              medication={med}
              index={index}
              onUpdate={(field, value) => updateMedication(med.id, field, value)}
              onRemove={() => removeMedication(med.id)}
              canRemove={medications.length > 1}
            />
          ))}
          <Button variant="outline" onClick={addMedication} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Medicamento
          </Button>
        </CardContent>
      </Card>

      {/* Seção: Orientações */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Orientações
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSection("orientations")}
            disabled={isGenerating === "orientations"}
          >
            {isGenerating === "orientations" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Gerar com IA
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Orientações de cuidado, alimentação, repouso..."
            value={orientations}
            onChange={(e) => setOrientations(e.target.value)}
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Seção: Sinais de Alerta */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Sinais de Alerta
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSection("alertSigns")}
            disabled={isGenerating === "alertSigns"}
          >
            {isGenerating === "alertSigns" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Gerar com IA
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Quando procurar atendimento médico imediatamente..."
            value={alertSigns}
            onChange={(e) => setAlertSigns(e.target.value)}
            rows={5}
          />
        </CardContent>
      </Card>

      {/* Seção: Prevenção */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Como Prevenir
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSection("prevention")}
            disabled={isGenerating === "prevention"}
          >
            {isGenerating === "prevention" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Gerar com IA
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Orientações preventivas para evitar novos episódios..."
            value={prevention}
            onChange={(e) => setPrevention(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Seção: Anotações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Anotações Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="returnDays"
                checked={returnDays !== null}
                onCheckedChange={(checked) =>
                  setReturnDays(checked ? 7 : null)
                }
              />
              <Label htmlFor="returnDays" className="flex items-center gap-2">
                Retornar em
                <Input
                  type="number"
                  className="w-16 h-8"
                  value={returnDays || ""}
                  onChange={(e) =>
                    setReturnDays(e.target.value ? parseInt(e.target.value) : null)
                  }
                  disabled={returnDays === null}
                />
                dias
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="bringExams"
                checked={bringExams}
                onCheckedChange={(checked) => setBringExams(checked as boolean)}
              />
              <Label htmlFor="bringExams">Levar resultados de exames</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="observeFeeding"
                checked={observeFeeding}
                onCheckedChange={(checked) =>
                  setObserveFeeding(checked as boolean)
                }
              />
              <Label htmlFor="observeFeeding">
                Observar aceitação alimentar
              </Label>
            </div>
          </div>

          <Textarea
            placeholder="Outras anotações..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Rodapé Preview */}
      <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
        <p className="font-medium">{doctor.name}</p>
        {doctor.crm && <p>CRM {doctor.crm}</p>}
        <p className="mt-1">{today}</p>
      </div>

      <Separator />

      {/* Ações */}
      <div className="flex items-center justify-between">
        <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <BookMarked className="h-4 w-4 mr-2" />
              Salvar como Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar como Template</DialogTitle>
              <DialogDescription>
                Salve esta receita como um template para reutilizar em futuras consultas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="templateName">Nome do Template</Label>
              <Input
                id="templateName"
                placeholder="Ex: Gastroenterite, Gripe, Otite..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveAsTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-2">
          <Link href={`/consultations/${consultationId}/preview`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={savePrescription} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Receita
          </Button>
          {existingPrescription && (
            <Button asChild variant="secondary">
              <a href={`/api/prescriptions/${consultationId}/download`} download>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
