"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search, Star, StarOff, TrendingUp, FileText, Loader2, Save, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { PrescriptionTemplate } from "@/lib/types/prescription-template";
import { formatTemplate } from "@/lib/types/prescription-template";
import { cn } from "@/lib/utils";

interface TemplateSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (templateText: string, templateId: string) => void;
  patientWeight?: number | null;
}

export function TemplateSelectorModal({
  open,
  onOpenChange,
  onSelectTemplate,
  patientWeight,
}: TemplateSelectorModalProps) {
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PrescriptionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [customDescription, setCustomDescription] = useState("");
  const [generatedTemplates, setGeneratedTemplates] = useState<any[]>([]);
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<PrescriptionTemplate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const supabase = createClient();

  // Buscar templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  // Filtrar templates
  useEffect(() => {
    let filtered = templates;

    // Filtrar por categoria
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filtrar por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.instructions?.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("prescription_templates")
        .select("*")
        .order("usage_count", { ascending: false }) // Mais usados primeiro!
        .order("is_favorite", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: PrescriptionTemplate) => {
    setPreviewTemplate(template);
    setDrawerOpen(true);
  };

  const handleConfirmTemplate = async () => {
    if (!previewTemplate) return;

    try {
      // Incrementar contador de uso
      await supabase
        .from("prescription_templates")
        .update({ usage_count: (previewTemplate.usage_count || 0) + 1 })
        .eq("id", previewTemplate.id);

      // Formatar template com peso do paciente
      const formattedText = formatTemplate(previewTemplate, patientWeight || undefined);

      // Passar para o componente pai
      onSelectTemplate(formattedText, previewTemplate.id);
      
      // Fechar tudo
      setDrawerOpen(false);
      setPreviewTemplate(null);
      onOpenChange(false);

      toast.success(`Template "${previewTemplate.name}" inserido!`);
    } catch (error: any) {
      console.error("Erro ao selecionar template:", error);
      toast.error("Erro ao inserir template");
    }
  };

  const toggleFavorite = async (template: PrescriptionTemplate) => {
    try {
      const { error } = await supabase
        .from("prescription_templates")
        .update({ is_favorite: !template.is_favorite })
        .eq("id", template.id);

      if (error) throw error;

      // Atualizar localmente
      setTemplates(
        templates.map((t) =>
          t.id === template.id ? { ...t, is_favorite: !t.is_favorite } : t
        )
      );

      toast.success(
        template.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos"
      );
    } catch (error: any) {
      console.error("Erro ao favoritar:", error);
      toast.error("Erro ao atualizar favorito");
    }
  };

  // Obter categorias únicas
  const categories = Array.from(new Set(templates.map((t) => t.category))).filter(Boolean);

  // Função removida - não gerar mais 15 templates padrão

  // Gerar templates personalizados (3)
  const handleGenerateCustomTemplates = async () => {
    if (!customDescription || customDescription.trim().length < 5) {
      toast.error("Descreva o que você precisa (mínimo 5 caracteres)");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      toast.info("🤖 Gerando 3 templates personalizados...");

      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => (prev >= 90 ? prev : prev + 30));
      }, 1000);

      const response = await fetch("/api/templates/generate-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: customDescription,
          count: 3,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao gerar templates");
      }

      const data = await response.json();
      setGenerationProgress(100);
      setGeneratedTemplates(data.templates);
      setShowGeneratedPreview(true);
      toast.success(`✨ ${data.count} templates gerados!`);
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error(error.message || "Erro ao gerar");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Salvar template gerado
  const handleSaveGeneratedTemplate = async (template: any) => {
    try {
      const { error } = await supabase.from("prescription_templates").insert({
        name: template.name,
        category: template.category,
        medications: template.medications,
        instructions: template.instructions,
        warnings: template.warnings,
      });

      if (error) throw error;

      toast.success("Template salvo!");
      setShowGeneratedPreview(false);
      setGeneratedTemplates([]);
      setCustomDescription("");
      await loadTemplates();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar template");
    }
  };

  // Usar template gerado sem salvar
  const handleUseGeneratedTemplate = (template: any) => {
    const formattedText = `PRESCRIÇÃO:\n${template.medications
      .map((m: any, i: number) => `${i + 1}. ${m.name} ${m.dosage}, ${m.frequency}`)
      .join("\n")}\n\nORIENTAÇÕES:\n${template.instructions}\n\n⚠️  ATENÇÃO:\n${
      template.warnings
    }`;

    onSelectTemplate(formattedText, "custom");
    setShowGeneratedPreview(false);
    setGeneratedTemplates([]);
    setCustomDescription("");
    onOpenChange(false);
    toast.success("Template inserido!");
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Template de Prescrição</DialogTitle>
          <DialogDescription>
            {patientWeight
              ? `Dosagens serão calculadas automaticamente para ${patientWeight}kg`
              : "Escolha um template para inserir na prescrição"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Lista de Templates */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold">{generationProgress}%</span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold">Gerando Templates com IA</p>
                  <p className="text-sm text-muted-foreground">
                    GPT-4o-mini está criando 3 templates personalizados...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Isso pode levar 30-60 segundos
                  </p>
                </div>
              </div>
            ) : showGeneratedPreview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-semibold">Templates Gerados</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowGeneratedPreview(false);
                      setGeneratedTemplates([]);
                    }}
                  >
                    Voltar
                  </Button>
                </div>
                {generatedTemplates.map((template, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        {template.name}
                        <Badge variant="secondary">{template.category}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">
                          Medicações:
                        </p>
                        <div className="space-y-1">
                          {template.medications.map((med: any, i: number) => (
                            <p key={i} className="text-sm">
                              • {med.name} {med.dosage}, {med.frequency}
                            </p>
                          ))}
                        </div>
                      </div>
                      {template.instructions && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            Orientações:
                          </p>
                          <p className="text-sm">{template.instructions}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveGeneratedTemplate(template)}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Template
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUseGeneratedTemplate(template)}
                          className="flex-1"
                        >
                          Usar Agora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 && !searchQuery && !selectedCategory ? (
              <div className="space-y-6">
                {/* Gerador Personalizado */}
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                      <FileText className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Criar Templates com IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Descreva o que você precisa e a IA gerará 3 templates
                    </p>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <Input
                      placeholder="Ex: tratamento para febre alta em lactente"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      disabled={isGenerating}
                      className="text-center"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerateCustomTemplates();
                      }}
                    />
                    <Button
                      className="w-full gap-2"
                      onClick={handleGenerateCustomTemplates}
                      disabled={isGenerating || customDescription.trim().length < 5}
                    >
                      <Sparkles className="h-4 w-4" />
                      Gerar 3 Templates Personalizados
                    </Button>
                  </div>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum template encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente ajustar sua busca ou filtros
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all cursor-pointer hover:border-primary hover:bg-primary/5",
                      template.is_favorite && "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20"
                    )}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.usage_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              {template.usage_count}
                            </span>
                          )}
                        </div>

                        {/* Preview de medicações */}
                        {template.medications && template.medications.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {template.medications.slice(0, 3).map((med: any, idx: number) => (
                              <div key={idx}>• {med.name} {med.dosage}</div>
                            ))}
                            {template.medications.length > 3 && (
                              <div className="text-xs">
                                +{template.medications.length - 3} medicação(ões)
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(template);
                        }}
                        className="flex-shrink-0"
                      >
                        {template.is_favorite ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>

    {/* Drawer de Preview */}
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Preview da Prescrição</span>
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DrawerTitle>
          <DrawerDescription>
            {previewTemplate && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{previewTemplate.category}</Badge>
                <span className="text-sm">{previewTemplate.name}</span>
              </div>
            )}
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-6">
          {previewTemplate && (
            <div className="space-y-6 pb-6">
              {/* Medicações */}
              {previewTemplate.medications && previewTemplate.medications.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Medicações
                  </h3>
                  <div className="space-y-2">
                    {previewTemplate.medications.map((med: any, idx: number) => (
                      <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium">{idx + 1}. {med.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Dosagem: {med.dosage}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Frequência: {med.frequency}
                        </p>
                        {med.duration && (
                          <p className="text-sm text-muted-foreground">
                            Duração: {med.duration}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instruções */}
              {previewTemplate.instructions && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Orientações
                  </h3>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{previewTemplate.instructions}</p>
                  </div>
                </div>
              )}

              {/* Alertas */}
              {previewTemplate.warnings && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-red-600">
                    ⚠️ Atenção
                  </h3>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                      {previewTemplate.warnings}
                    </p>
                  </div>
                </div>
              )}

              {/* Info de dosagem automática */}
              {patientWeight && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ Dosagens calculadas automaticamente para paciente de <strong>{patientWeight}kg</strong>
                  </p>
                </div>
              )}

              {/* Preview Formatado */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Preview do Texto Final
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {formatTemplate(previewTemplate, patientWeight || undefined)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DrawerFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => setDrawerOpen(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirmTemplate} className="flex-1">
            Usar esta Prescrição
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    </>
  );
}
