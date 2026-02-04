"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, StarOff, TrendingUp, X, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { PrescriptionTemplate } from "@/lib/types/prescription-template";
import { formatTemplate } from "@/lib/types/prescription-template";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

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
  // Estados principais
  const [activeTab, setActiveTab] = useState<'favorites' | 'my' | 'community'>('favorites');
  const [myTemplates, setMyTemplates] = useState<PrescriptionTemplate[]>([]);
  const [communityTemplates, setCommunityTemplates] = useState<PrescriptionTemplate[]>([]);
  const [filteredMyTemplates, setFilteredMyTemplates] = useState<PrescriptionTemplate[]>([]);
  const [filteredCommunityTemplates, setFilteredCommunityTemplates] = useState<PrescriptionTemplate[]>([]);
  const [filteredFavoriteTemplates, setFilteredFavoriteTemplates] = useState<PrescriptionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Drawer de preview
  const [previewTemplate, setPreviewTemplate] = useState<PrescriptionTemplate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const supabase = createClient();

  // Carregar templates ao abrir modal
  useEffect(() => {
    if (open) {
      loadTemplates();
      setSearchQuery("");
    }
  }, [open]);

  // Filtrar templates por busca
  useEffect(() => {
    const filterTemplates = (templates: PrescriptionTemplate[]) => {
      if (!searchQuery) return templates;

      const query = searchQuery.toLowerCase();
      return templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.instructions?.toLowerCase().includes(query)
      );
    };

    // Combinar meus templates + comunidade para pegar todos os favoritos
    const allTemplates = [...myTemplates, ...communityTemplates];
    const favoriteTemplates = allTemplates.filter(t => t.is_favorite);

    setFilteredMyTemplates(filterTemplates(myTemplates));
    setFilteredCommunityTemplates(filterTemplates(communityTemplates));
    setFilteredFavoriteTemplates(filterTemplates(favoriteTemplates));
  }, [myTemplates, communityTemplates, searchQuery]);

  // Carregar templates separadamente
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);

      // Meus templates: doctor_id = user.id AND is_open_template = false
      const { data: myData, error: myError } = await supabase
        .from("prescription_templates")
        .select("*")
        .eq("doctor_id", user?.id)
        .eq("is_open_template", false)
        .order("is_favorite", { ascending: false })
        .order("usage_count", { ascending: false })
        .order("created_at", { ascending: false });

      if (myError) throw myError;

      // Templates comunidade: is_open_template = true
      const { data: communityData, error: communityError } = await supabase
        .from("prescription_templates")
        .select("*")
        .eq("is_open_template", true)
        .order("usage_count", { ascending: false })
        .order("created_at", { ascending: false });

      if (communityError) throw communityError;

      setMyTemplates(myData || []);
      setCommunityTemplates(communityData || []);
      setFilteredMyTemplates(myData || []);
      setFilteredCommunityTemplates(communityData || []);
    } catch (error: any) {
      console.error("Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir drawer de preview
  const handleSelectTemplate = (template: PrescriptionTemplate) => {
    setPreviewTemplate(template);
    setDrawerOpen(true);
  };

  // Confirmar uso do template
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

  // Toggle favoritar template
  const toggleFavorite = async () => {
    if (!previewTemplate) return;

    try {
      const newFavoriteState = !previewTemplate.is_favorite;

      const { error } = await supabase
        .from("prescription_templates")
        .update({ is_favorite: newFavoriteState })
        .eq("id", previewTemplate.id);

      if (error) throw error;

      // Atualizar localmente
      const updateTemplates = (templates: PrescriptionTemplate[]) =>
        templates.map((t) =>
          t.id === previewTemplate.id ? { ...t, is_favorite: newFavoriteState } : t
        );

      setMyTemplates(updateTemplates(myTemplates));
      setCommunityTemplates(updateTemplates(communityTemplates));
      setPreviewTemplate({ ...previewTemplate, is_favorite: newFavoriteState });

      toast.success(
        newFavoriteState ? "Adicionado aos favoritos" : "Removido dos favoritos"
      );
    } catch (error: any) {
      console.error("Erro ao favoritar:", error);
      toast.error("Erro ao atualizar favorito");
    }
  };

  // Renderizar lista de templates
  const renderTemplateList = (templates: PrescriptionTemplate[], emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando templates...</p>
          </div>
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className={cn(
              "cursor-pointer transition-all hover:bg-accent hover:border-primary/50",
              "border rounded-lg"
            )}
          >
            <CardContent className="px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-xs truncate">{template.name}</h3>
                    {template.is_favorite && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                    {template.usage_count > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Usado {template.usage_count}x
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Selecionar Template</DialogTitle>
            <DialogDescription>
              {patientWeight
                ? `Dosagens serão calculadas automaticamente para ${patientWeight}kg`
                : "Escolha um template para inserir na prescrição"}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'favorites' | 'my' | 'community')}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-full flex-shrink-0">
              <TabsTrigger value="favorites" className="flex-1 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="my" className="flex-1">
                Meus Templates
              </TabsTrigger>
              <TabsTrigger value="community" className="flex-1 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Comunidade
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 mb-4 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <TabsContent value="favorites" className="flex-1 mt-0 min-h-0">
              <ScrollArea className="h-full pr-4">
                {renderTemplateList(
                  filteredFavoriteTemplates,
                  searchQuery
                    ? "Nenhum favorito encontrado com esse termo"
                    : "Você ainda não favoritou nenhum template"
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="my" className="flex-1 mt-0 min-h-0">
              <ScrollArea className="h-full pr-4">
                {renderTemplateList(
                  filteredMyTemplates,
                  searchQuery
                    ? "Nenhum template encontrado com esse termo"
                    : "Você ainda não criou nenhum template"
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="community" className="flex-1 mt-0 min-h-0">
              <ScrollArea className="h-full pr-4">
                {renderTemplateList(
                  filteredCommunityTemplates,
                  searchQuery
                    ? "Nenhum template encontrado com esse termo"
                    : "Nenhum template da comunidade disponível"
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex justify-start items-start ">
            <p className="flex  flex-1 text-xs items-center justify-center align-middle text-muted-foreground">
              {filteredFavoriteTemplates.length} favoritos | {filteredMyTemplates.length} meus | {filteredCommunityTemplates.length} comunidade
            </p>
          </DialogFooter>
        </DialogContent>

      </Dialog>

      {/* Drawer de Preview - Lateral Direita */}
      <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 min-w-[600px]  rounded-none flex flex-col">
          <DrawerHeader className="border-b flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DrawerTitle className="text-xl mb-2">{previewTemplate?.name}</DrawerTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{previewTemplate?.category}</Badge>
                  {previewTemplate && previewTemplate.usage_count > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Usado {previewTemplate.usage_count}x
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6 py-4">
              {previewTemplate && (
                <div className="space-y-6 pb-4">
                  {/* Medicações */}
                  {previewTemplate.medications && previewTemplate.medications.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        Medicações
                      </h3>
                      <div className="space-y-2">
                        {previewTemplate.medications.map((med: any, idx: number) => (
                          <div key={idx} className="p-3 bg-muted/50 rounded-lg border">
                            <p className="font-medium">{idx + 1}. {med.name}</p>
                            <div className="mt-1 space-y-0.5">
                              <p className="text-sm text-muted-foreground">
                                Dosagem: {med.dosage}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Frequência: {med.frequency}
                              </p>
                              {med.route && (
                                <p className="text-sm text-muted-foreground">
                                  Via: {med.route}
                                </p>
                              )}
                              {med.duration && (
                                <p className="text-sm text-muted-foreground">
                                  Duração: {med.duration}
                                </p>
                              )}
                              {med.condition && (
                                <p className="text-sm text-muted-foreground italic">
                                  Condição: {med.condition}
                                </p>
                              )}
                            </div>
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
                      <div className="p-3 bg-muted/50 rounded-lg border">
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
          </div>

          <DrawerFooter className="border-t flex-row gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={toggleFavorite}
              className="flex items-center gap-2"
            >
              {previewTemplate?.is_favorite ? (
                <>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  Favoritado
                </>
              ) : (
                <>
                  <StarOff className="h-4 w-4" />
                  Favoritar
                </>
              )}
            </Button>
            <Button onClick={handleConfirmTemplate} className="flex-1">
              Usar Template
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
