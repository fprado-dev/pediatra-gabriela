"use client";

import { useState } from "react";
import { ConsultationType, PuericulturaSubtype } from "@/lib/types/consultation";
import { 
  CONSULTATION_TYPE_OPTIONS,
  PUERICULTURA_SUBTYPE_OPTIONS,
  getConsultationTypeIcon,
  getConsultationTypeColor 
} from "@/lib/utils/consultation-type-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsultationTypeSelectorProps {
  selectedType: ConsultationType | null;
  selectedSubtype: PuericulturaSubtype | null;
  onSelect: (type: ConsultationType, subtype?: PuericulturaSubtype) => void;
  className?: string;
}

export function ConsultationTypeSelector({
  selectedType,
  selectedSubtype,
  onSelect,
  className
}: ConsultationTypeSelectorProps) {
  const [expandedType, setExpandedType] = useState<ConsultationType | null>(
    selectedType === 'puericultura' ? 'puericultura' : null
  );

  const handleTypeClick = (type: ConsultationType) => {
    if (type === 'puericultura') {
      // Expandir/colapsar puericultura
      setExpandedType(expandedType === 'puericultura' ? null : 'puericultura');
      // Não selecionar ainda - aguardar escolha do subtipo
    } else {
      // Outros tipos são selecionados diretamente
      onSelect(type);
      setExpandedType(null);
    }
  };

  const handleSubtypeClick = (subtype: PuericulturaSubtype) => {
    onSelect('puericultura', subtype);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          Tipo de Consulta
        </h3>
        <p className="text-xs text-gray-500">
          Selecione o tipo de consulta pediátrica
        </p>
      </div>

      {/* Tipos Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {CONSULTATION_TYPE_OPTIONS.map((option) => {
          const Icon = getConsultationTypeIcon(option.type);
          const isSelected = selectedType === option.type;
          const colors = getConsultationTypeColor(option.type);

          return (
            <Card
              key={option.type}
              className={cn(
                "relative cursor-pointer transition-all hover:scale-[1.02]",
                isSelected && option.type !== 'puericultura'
                  ? `border-2 ${colors.border} ${colors.bg}`
                  : "border border-gray-200 hover:border-gray-300",
                expandedType === option.type && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => handleTypeClick(option.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isSelected && option.type !== 'puericultura' ? colors.bg : "bg-gray-100"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected && option.type !== 'puericultura' ? colors.icon : "text-gray-600"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm font-semibold",
                        isSelected && option.type !== 'puericultura' ? colors.text : "text-gray-900"
                      )}>
                        {option.label}
                      </h4>
                      {isSelected && option.type !== 'puericultura' && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Badge para Puericultura */}
                {option.type === 'puericultura' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Badge variant="outline" className="text-xs">
                      {expandedType === 'puericultura' ? 'Selecione o tipo abaixo' : 'Clique para ver opções'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subtipos de Puericultura (Expandível) */}
      {expandedType === 'puericultura' && (
        <div className="space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <span className="text-xs font-medium text-gray-500 px-2">Selecione o Período</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PUERICULTURA_SUBTYPE_OPTIONS.map((option) => {
              const isSelected = selectedSubtype === option.value;

              return (
                <Card
                  key={option.value}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-[1.02]",
                    isSelected
                      ? "border-2 border-primary bg-primary/5"
                      : "border border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleSubtypeClick(option.value)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className={cn(
                          "text-sm font-medium mb-0.5",
                          isSelected ? "text-primary" : "text-gray-900"
                        )}>
                          {option.label}
                        </h5>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
