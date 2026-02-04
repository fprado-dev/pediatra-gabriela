export function ConsultationSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg animate-pulse">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>

      {/* Body - Blocos principais */}
      <div className="p-4 space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-4/5 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 flex justify-end">
        <div className="h-9 w-9 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function ConsultationListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
      {Array.from({ length: count }).map((_, i) => (
        <ConsultationSkeleton key={i} />
      ))}
    </div>
  );
}
