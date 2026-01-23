"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, StarOff, TrendingUp, FileText, Loader2 } from "lucide-react";
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
        .order("usage_count", { ascending: false })
        .order("name");

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

  const handleSelectTemplate = async (template: PrescriptionTemplate) => {
    try {
      // Incrementar contador de uso
      await supabase
        .from("prescription_templates")
        .update({ usage_count: template.usage_count + 1 })
        .eq("id", template.id);

      // Formatar template com peso do paciente
      const formattedText = formatTemplate(template, patientWeight || undefined);

      // Passar para o componente pai
      onSelectTemplate(formattedText, template.id);
      onOpenChange(false);

      toast.success(`Template "${template.name}" inserido!`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
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
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory
                    ? "Nenhum template encontrado"
                    : "Nenhum template criado ainda"}
                </p>
                {!searchQuery && !selectedCategory && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Templates serão gerados automaticamente pela IA
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
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
                            {template.medications.slice(0, 2).map((med: any, idx: number) => (
                              <div key={idx}>• {med.name} {med.dosage}</div>
                            ))}
                            {template.medications.length > 2 && (
                              <div className="text-xs">
                                +{template.medications.length - 2} medicação(ões)
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
  );
}
