"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
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
  Cake,
  UserCheck,
  Weight,
  Microscope,
  Ruler,
} from "lucide-react";
import { MedicationItem } from "./medication-item";
import { ptBR } from "date-fns/locale";
import { PrescriptionFormFAB } from "./prescription-form-fab";
import { TemplateSelectorModal } from "../templates/template-selector-modal";

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
  height?: number;
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
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateIsOpen, setTemplateIsOpen] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{ text: string, id: string } | null>(null);

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
  const loadTemplate = async (templateId: string) => {
    try {
      // Buscar template diretamente do Supabase para garantir dados atualizados
      const { data: template, error } = await supabase
        .from("prescription_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error || !template) {
        console.error("Erro ao carregar template:", error);
        toast.error("Erro ao carregar template");
        return;
      }

      // Aplicar medicações
      if (template.medications && template.medications.length > 0) {
        setMedications(
          template.medications.map((m: any) => {
            // Combinar campos do template em instructions
            const instructionParts = [];
            if (m.frequency) instructionParts.push(m.frequency);
            if (m.route) instructionParts.push(`via ${m.route}`);
            if (m.duration) instructionParts.push(m.duration);
            if (m.condition) instructionParts.push(m.condition);
            if (m.notes) instructionParts.push(m.notes);

            return {
              id: crypto.randomUUID(),
              name: m.name || "",
              dosage: m.dosage || "",
              quantity: "", // Deixar vazio para o médico preencher
              instructions: instructionParts.join(", "),
            };
          })
        );
      }

      // Aplicar outros campos (usando nomes corretos do schema)
      if (template.instructions) setOrientations(template.instructions);
      if (template.warnings) setAlertSigns(template.warnings);

      toast.success(`Template "${template.name}" carregado!`);
    } catch (error) {
      console.error("Erro ao carregar template:", error);
      toast.error("Erro ao carregar template");
    }
  };

  // Abrir seletor de templates
  const handleUseTemplate = () => {
    setShowTemplateSelector(true);
  };

  // Callback do seletor de templates
  const handleSelectTemplate = (templateText: string, templateId: string) => {
    // Verificar se há conteúdo atual
    const hasContent = medications.some(m => m.name.trim()) ||
      orientations.trim() ||
      alertSigns.trim() ||
      prevention.trim() ||
      notes.trim();

    if (hasContent) {
      // Pedir confirmação
      setPendingTemplate({ text: templateText, id: templateId });
      setShowReplaceConfirm(true);
    } else {
      // Aplicar diretamente
      applyTemplate(templateText, templateId);
    }
  };

  // Aplicar template
  const applyTemplate = async (templateText: string, templateId: string) => {
    await loadTemplate(templateId);
    setShowTemplateSelector(false);
    setPendingTemplate(null);
    setShowReplaceConfirm(false);
  };

  // Salvar como template
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    if (!templateCategory.trim()) {
      toast.error("Selecione uma categoria");
      return;
    }

    try {
      // Obter o user ID atual
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from("prescription_templates").insert({
        doctor_id: user.id,
        name: templateName,
        category: templateCategory,
        description: templateDescription || null,
        medications: medications.filter((m) => m.name.trim()),
        instructions: orientations || null,
        warnings: alertSigns || null,
        alert_signs: alertSigns || null,
        prevention: prevention || null,
        is_open_template: templateIsOpen,
      });

      if (error) throw error;

      toast.success("Template salvo com sucesso!");
      setShowSaveTemplateDialog(false);
      // Limpar campos
      setTemplateName("");
      setTemplateCategory("");
      setTemplateDescription("");
      setTemplateIsOpen(false);
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

      const { error } = await supabase
        .from("consultations")
        .update({
          prescription_data: prescriptionData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", consultationId);

      if (error) throw error;

      toast.success("Receita salva com sucesso!");
      router.push(`/consultations/${consultationId}/prescription/view`);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar receita");
    } finally {
      setIsSaving(false);
    }
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* FAB de ações */}
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {patient?.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-4">
              {patient?.age && (
                <div className="flex items-center gap-1.5">
                  <Cake className="h-3.5 w-3.5 text-gray-400" />
                  {patient?.age && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-700 font-medium">{patient?.age}</span>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Weight className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient?.weight}kg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient?.height}cm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Microscope className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient?.allergies}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-gray-400" />
                <span>{patient?.currentMedications}</span>
              </div>

            </div>



          </div>
          <Link href="/consultations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
        <Separator className="my-4" />


        {patient.allergies && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Alergias do Paciente</p>
              <p className="text-sm text-destructive/80">{patient.allergies}</p>
            </div>
          </div>
        )}
        <div className="p-2 flex flex-col gap-4">
          {/*  Seção Medicamentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Medicamentos
              </CardTitle>
              <Button
                variant="outline"
                size="xs"
                onClick={() => generateSection("medications")}
                disabled={isGenerating === "medications"}
              >
                {isGenerating === "medications" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
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
                <Plus className="h-4 w-4" />
                Adicionar Medicamento
              </Button>
            </CardContent>
          </Card>
          {/*  Seção Orientações */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Orientações
              </CardTitle>
              <Button
                variant="outline"
                size="xs"
                onClick={() => generateSection("orientations")}
                disabled={isGenerating === "orientations"}
              >
                {isGenerating === "orientations" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar com IA
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Orientações de cuidado, alimentação, repouso..."
                value={orientations}
                onChange={(e) => setOrientations(e.target.value)}
                rows={15}
                className="resize-none"
                disabled={isGenerating === "orientations"}
              />
            </CardContent>
          </Card>

          {/*  Seção Sinais de Alerta */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Sinais de Alerta
              </CardTitle>
              <Button
                variant="outline"
                size="xs"
                onClick={() => generateSection("alertSigns")}
                disabled={isGenerating === "alertSigns"}
              >
                {isGenerating === "alertSigns" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar com IA
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Quando procurar atendimento médico imediatamente..."
                value={alertSigns}
                onChange={(e) => setAlertSigns(e.target.value)}
                rows={10}
                className="resize-none"
                disabled={isGenerating === "alertSigns"}
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
                size="xs"
                onClick={() => generateSection("prevention")}
                disabled={isGenerating === "prevention"}
              >
                {isGenerating === "prevention" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Gerar com IA
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Orientações preventivas para evitar novos episódios..."
                value={prevention}
                onChange={(e) => setPrevention(e.target.value)}
                rows={10}
                className="resize-none"
                disabled={isGenerating === "prevention"}
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



        </div>
      </div>

      {/* FAB de Ações */}
      <PrescriptionFormFAB
        consultationId={consultationId}
        isSaving={isSaving}
        onSave={savePrescription}
        onUseTemplate={handleUseTemplate}
        onSaveAsTemplate={() => setShowSaveTemplateDialog(true)}
        existingPrescription={!!existingPrescription}
      />

      {/* Modal de Seleção de Templates */}
      <TemplateSelectorModal
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelectTemplate={handleSelectTemplate}
        patientWeight={patient.weight}
      />

      {/* Dialog de Confirmação para Substituir Conteúdo */}
      <Dialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituir Conteúdo Atual?</DialogTitle>
            <DialogDescription>
              Você já tem conteúdo preenchido nesta receita. Deseja substituir todo o conteúdo pelo template selecionado?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReplaceConfirm(false);
              setPendingTemplate(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={() => {
              if (pendingTemplate) {
                applyTemplate(pendingTemplate.text, pendingTemplate.id);
              }
            }}>
              Sim, Substituir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Salvar como Template */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Salvar como Template</DialogTitle>
            <DialogDescription>
              Salve esta receita como um template para reutilizar em futuras consultas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="templateName">Nome do Template *</Label>
              <Input
                id="templateName"
                placeholder="Ex: Gastroenterite, Gripe, Otite..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="templateCategory">Categoria *</Label>
              <Select value={templateCategory} onValueChange={setTemplateCategory}>
                <SelectTrigger id="templateCategory">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sintomas Comuns">Sintomas Comuns</SelectItem>
                  <SelectItem value="Antibióticos">Antibióticos</SelectItem>
                  <SelectItem value="Doenças Crônicas">Doenças Crônicas</SelectItem>
                  <SelectItem value="Preventivos">Preventivos</SelectItem>
                  <SelectItem value="Orientações Gerais">Orientações Gerais</SelectItem>
                  <SelectItem value="Respiratório">Respiratório</SelectItem>
                  <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
                  <SelectItem value="Dermatológico">Dermatológico</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="templateDescription">Descrição</Label>
              <Textarea
                id="templateDescription"
                placeholder="Descreva quando usar este template..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Checkbox Comunidade */}
            <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="templateIsOpen"
                checked={templateIsOpen}
                onCheckedChange={(checked) => setTemplateIsOpen(checked as boolean)}
              />
              <div className="flex-1">
                <Label
                  htmlFor="templateIsOpen"
                  className="text-sm font-medium cursor-pointer"
                >
                  Compartilhar com a comunidade
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Outros médicos poderão ver e usar este template (recomendado)
                </p>
              </div>
            </div>

            {/* Resumo do que será salvo */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">O que será salvo:</p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4">
                <li>✓ {medications.filter(m => m.name.trim()).length} medicação(ões)</li>
                {orientations && <li>✓ Orientações gerais</li>}
                {alertSigns && <li>✓ Sinais de alerta</li>}
                {prevention && <li>✓ Como prevenir</li>}
              </ul>
            </div>
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
    </div>
  );
}


