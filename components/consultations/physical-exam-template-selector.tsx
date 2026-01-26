"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  TemplatesBySystem,
  CompleteExamTemplate,
  getAgeGroupLabel,
  getAgeGroup,
} from "@/lib/types/physical-exam";

interface PhysicalExamTemplateSelectorProps {
  patientId: string;
  patientName: string;
  dateOfBirth: string;
  sex: "male" | "female";
  onInsert: (text: string, mode: "replace" | "append") => void;
}

export function PhysicalExamTemplateSelector({
  patientId,
  patientName,
  dateOfBirth,
  sex,
  onInsert,
}: PhysicalExamTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState<TemplatesBySystem[]>([]);
  const [completeTemplate, setCompleteTemplate] = useState<CompleteExamTemplate | null>(null);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [useCompleteTemplate, setUseCompleteTemplate] = useState(false);
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [pendingText, setPendingText] = useState("");

  const ageGroup = useMemo(() => getAgeGroup(dateOfBirth), [dateOfBirth]);
  const ageGroupLabel = useMemo(() => getAgeGroupLabel(ageGroup), [ageGroup]);
  const sexLabel = sex === "male" ? "Masculino" : "Feminino";

  // Fetch templates when dialog opens
  useEffect(() => {
    if (open && templates.length === 0) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Fetch both individual systems and complete template
      const [systemsRes, completeRes] = await Promise.all([
        fetch(
          `/api/physical-exam-templates?dateOfBirth=${dateOfBirth}&sex=${sex}`
        ),
        fetch(
          `/api/physical-exam-templates?dateOfBirth=${dateOfBirth}&sex=${sex}&complete=true`
        ),
      ]);

      if (!systemsRes.ok || !completeRes.ok) {
        throw new Error("Erro ao buscar templates");
      }

      const systemsData = await systemsRes.json();
      const completeData = await completeRes.json();

      setTemplates(systemsData.templates || []);
      setCompleteTemplate(completeData);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  };

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;

    const query = searchQuery.toLowerCase();
    return templates
      .map((group) => ({
        ...group,
        templates: group.templates.filter(
          (t) =>
            t.system_label.toLowerCase().includes(query) ||
            t.template_text.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.templates.length > 0);
  }, [templates, searchQuery]);

  const handleSystemToggle = (systemName: string) => {
    setSelectedSystems((prev) =>
      prev.includes(systemName)
        ? prev.filter((s) => s !== systemName)
        : [...prev, systemName]
    );
  };

  const handleInsertClick = () => {
    let textToInsert = "";

    if (useCompleteTemplate && completeTemplate) {
      textToInsert = completeTemplate.full_text;
    } else if (selectedSystems.length > 0) {
      // Build text from selected systems
      const selectedTemplates = templates
        .filter((group) => selectedSystems.includes(group.system_name))
        .map((group) => {
          const template = group.templates[0]; // Use first template (should be the default)
          return `**${template.system_label}**\n${template.template_text}`;
        });
      textToInsert = selectedTemplates.join("\n\n");
    }

    if (!textToInsert) {
      toast.error("Selecione pelo menos um sistema ou o template completo");
      return;
    }

    // Show dialog to choose replace or append
    setPendingText(textToInsert);
    setShowInsertDialog(true);
  };

  const handleConfirmInsert = (mode: "replace" | "append") => {
    onInsert(pendingText, mode);
    setShowInsertDialog(false);
    setOpen(false);
    setPendingText("");
    setSelectedSystems([]);
    setUseCompleteTemplate(false);
    toast.success("Template inserido com sucesso");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" type="button">
            <FileText className="h-4 w-4 mr-2" />
            Usar Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Templates de Exame Físico</DialogTitle>
            <DialogDescription>
              Selecione os sistemas que deseja incluir no exame físico
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Patient Info */}
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">
                  Paciente: {patientName}
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline">{ageGroupLabel}</Badge>
                  <Badge variant="outline">{sexLabel}</Badge>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Complete Template Option */}
              <div className="flex items-center space-x-2 p-3 rounded-lg border">
                <Checkbox
                  id="complete-template"
                  checked={useCompleteTemplate}
                  onCheckedChange={(checked) => {
                    setUseCompleteTemplate(!!checked);
                    if (checked) {
                      setSelectedSystems([]);
                    }
                  }}
                />
                <label
                  htmlFor="complete-template"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div>
                    <p className="font-semibold">Template Completo</p>
                    <p className="text-xs text-muted-foreground">
                      Incluir todos os 10 sistemas de uma vez
                    </p>
                  </div>
                </label>
              </div>

              {/* Individual Systems */}
              <div>
                <h4 className="text-sm font-medium mb-2">Sistemas Individuais</h4>
                <ScrollArea className="h-[300px] rounded-md border p-3">
                  <div className="space-y-3">
                    {filteredTemplates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchQuery
                          ? "Nenhum template encontrado"
                          : "Nenhum template disponível"}
                      </p>
                    ) : (
                      filteredTemplates.map((group) => (
                        <div
                          key={group.system_name}
                          className="flex items-start space-x-2"
                        >
                          <Checkbox
                            id={group.system_name}
                            checked={
                              selectedSystems.includes(group.system_name) ||
                              useCompleteTemplate
                            }
                            disabled={useCompleteTemplate}
                            onCheckedChange={() =>
                              handleSystemToggle(group.system_name)
                            }
                          />
                          <label
                            htmlFor={group.system_name}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <p className="font-medium">{group.system_label}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {group.templates[0]?.template_text.substring(0, 100)}...
                            </p>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleInsertClick}
              disabled={
                loading ||
                (!useCompleteTemplate && selectedSystems.length === 0)
              }
              type="button"
            >
              Inserir Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Insert Mode Dialog */}
      <AlertDialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Como deseja inserir o template?</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha se deseja substituir todo o conteúdo atual ou adicionar ao final.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmInsert("append")}
              variant="outline"
            >
              Adicionar ao Final
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleConfirmInsert("replace")}>
              Substituir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
