import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  buildPageUrl: (page: number) => string;
}

export function Pagination({ currentPage, totalPages, buildPageUrl }: PaginationProps) {
  // Gerar array de páginas visíveis (máximo 5)
  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Ajustar start se end atingiu o limite
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  // Classes base para botões
  const baseButtonClass = "inline-flex items-center justify-center h-9 px-3 text-sm font-medium rounded-md border transition-colors";
  const normalButtonClass = "bg-white text-gray-600 border-gray-300 hover:bg-gray-50";
  const activeButtonClass = "bg-gray-200 text-gray-900 border-gray-300 font-semibold";
  const disabledButtonClass = "opacity-50 cursor-not-allowed pointer-events-none";

  return (
    <div className="flex items-center justify-end gap-2 pt-6">
      {/* Botão Anterior */}
      <Link
        href={currentPage > 1 ? buildPageUrl(currentPage - 1) : "#"}
        className={`${baseButtonClass} ${normalButtonClass} gap-1 ${currentPage === 1 ? disabledButtonClass : ""}`}
        aria-disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Link>

      {/* Primeira página se não visível */}
      {visiblePages[0] > 1 && (
        <>
          <Link
            href={buildPageUrl(1)}
            className={`${baseButtonClass} ${normalButtonClass} w-9 p-0`}
          >
            1
          </Link>
          {visiblePages[0] > 2 && (
            <span className="px-1 text-gray-400 text-sm">...</span>
          )}
        </>
      )}

      {/* Páginas visíveis */}
      {visiblePages.map((page) => (
        <Link
          key={page}
          href={buildPageUrl(page)}
          className={`${baseButtonClass} w-9 p-0 ${
            currentPage === page ? activeButtonClass : normalButtonClass
          }`}
          aria-current={currentPage === page ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      {/* Última página se não visível */}
      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-gray-400 text-sm">...</span>
          )}
          <Link
            href={buildPageUrl(totalPages)}
            className={`${baseButtonClass} ${normalButtonClass} w-9 p-0`}
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* Botão Próximo */}
      <Link
        href={currentPage < totalPages ? buildPageUrl(currentPage + 1) : "#"}
        className={`${baseButtonClass} ${normalButtonClass} gap-1 ${currentPage === totalPages ? disabledButtonClass : ""}`}
        aria-disabled={currentPage === totalPages}
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
