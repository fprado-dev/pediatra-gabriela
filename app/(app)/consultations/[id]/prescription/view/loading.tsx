import { Skeleton } from "@/components/ui/skeleton";

export default function PrescriptionViewLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="px-6 max-w-7xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-md bg-gray-200" />
              <div className="space-y-3">
                <Skeleton className="h-7 w-48 bg-gray-200" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-64 bg-gray-200" />
                  <Skeleton className="h-3 w-32 bg-gray-200" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20 rounded-md bg-gray-200" />
              <Skeleton className="h-9 w-32 rounded-md bg-gray-200" />
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <Skeleton className="h-3 w-24 mb-1.5 bg-gray-200" />
            <Skeleton className="h-5 w-56 bg-gray-200" />
          </div>
        </div>

        {/* Medicamentos Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded bg-gray-200" />
                <Skeleton className="h-5 w-32 bg-gray-200" />
              </div>
              <Skeleton className="h-4 w-16 bg-gray-200" />
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="h-7 w-7 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <Skeleton className="h-5 w-48 bg-gray-200" />
                      <Skeleton className="h-4 w-32 mt-1 bg-gray-200" />
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <Skeleton className="h-3 w-16 mb-1 bg-gray-300" />
                      <Skeleton className="h-4 w-24 bg-gray-300" />
                    </div>
                    <div className="bg-blue-50/50 rounded-md p-3 border border-blue-100">
                      <Skeleton className="h-3 w-24 mb-1 bg-gray-300" />
                      <Skeleton className="h-4 w-full bg-gray-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orientações Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded bg-gray-200" />
              <Skeleton className="h-5 w-28 bg-gray-200" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-5/6 mt-2 bg-gray-200" />
            <Skeleton className="h-4 w-4/6 mt-2 bg-gray-200" />
          </div>
        </div>

        {/* Sinais de Alerta Card */}
        <div className="bg-orange-50/30 rounded-lg shadow-sm border border-orange-200/50">
          <div className="border-b border-orange-100/50 p-6 pb-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded bg-orange-200 flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-orange-200" />
                <Skeleton className="h-4 w-48 bg-orange-200" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-5/6 mt-2 bg-gray-200" />
            <Skeleton className="h-4 w-4/6 mt-2 bg-gray-200" />
          </div>
        </div>

        {/* Prevenção Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 p-6 pb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded bg-gray-200" />
              <Skeleton className="h-5 w-32 bg-gray-200" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-4/6 mt-2 bg-gray-200" />
          </div>
        </div>

        {/* Rodapé - Assinatura */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center space-y-2">
            <Skeleton className="h-px w-16 mx-auto mb-4 bg-gray-300" />
            <Skeleton className="h-5 w-48 mx-auto bg-gray-200" />
            <Skeleton className="h-4 w-32 mx-auto bg-gray-200" />
            <Skeleton className="h-3 w-24 mx-auto mt-2 bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
