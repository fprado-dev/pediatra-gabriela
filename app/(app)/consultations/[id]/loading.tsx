import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ConsultationDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Nome do Paciente */}
            <Skeleton className="h-9 w-64 bg-gray-300 mb-4" />

            {/* Informações do Paciente */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32 bg-gray-200" />
              <Skeleton className="h-4 w-40 bg-gray-200" />
              <Skeleton className="h-4 w-36 bg-gray-200" />
            </div>
          </div>

          {/* Botão Voltar */}
          <Skeleton className="h-9 w-24 bg-gray-200 rounded-md" />
        </div>

        <Separator className="my-4" />

        {/* Card Principal - Seções da Consulta */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">

          {/* Diagnóstico */}
          <div className="p-6 bg-blue-50/30">
            <Skeleton className="h-4 w-24 bg-gray-200 mb-3" />
            <Skeleton className="h-5 w-full bg-gray-200" />
            <Skeleton className="h-5 w-3/4 mt-2 bg-gray-200" />
          </div>

          {/* Queixa Principal */}
          <div className="p-6">
            <Skeleton className="h-4 w-32 bg-gray-200 mb-3" />
            <Skeleton className="h-5 w-full bg-gray-200" />
            <Skeleton className="h-5 w-5/6 mt-2 bg-gray-200" />
          </div>

          {/* Anamnese */}
          <div className="p-6">
            <Skeleton className="h-4 w-28 bg-gray-200 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-4/5 bg-gray-200" />
            </div>
          </div>

          {/* Exame Físico */}
          <div className="p-6">
            <Skeleton className="h-4 w-32 bg-gray-200 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-5/6 bg-gray-200" />
            </div>
          </div>

          {/* Plano Terapêutico */}
          <div className="p-6">
            <Skeleton className="h-4 w-40 bg-gray-200 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-3/4 bg-gray-200" />
            </div>
          </div>

          {/* Medidas Antropométricas */}
          <div className="p-6">
            <Skeleton className="h-4 w-48 bg-gray-200 mb-4" />
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Skeleton className="h-3 w-12 mx-auto mb-2 bg-gray-300" />
                  <Skeleton className="h-8 w-16 mx-auto bg-gray-300" />
                  <Skeleton className="h-3 w-8 mx-auto mt-1 bg-gray-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Desenvolvimento */}
          <div className="p-6">
            <Skeleton className="h-4 w-36 bg-gray-200 mb-3" />
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-4/5 mt-2 bg-gray-200" />
          </div>

          {/* Observações */}
          <div className="p-6">
            <Skeleton className="h-4 w-28 bg-gray-200 mb-3" />
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-3/4 mt-2 bg-gray-200" />
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-300" />
            <div className="flex-1">
              <Skeleton className="h-2 w-full bg-gray-200 mb-2" />
              <Skeleton className="h-3 w-32 bg-gray-200" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full bg-gray-300" />
          </div>
        </div>

        {/* Atestados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Skeleton className="h-5 w-40 bg-gray-200 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 bg-gray-200 mb-2" />
                    <Skeleton className="h-3 w-32 bg-gray-200" />
                  </div>
                  <Skeleton className="h-8 w-24 bg-gray-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
