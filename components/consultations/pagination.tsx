import Link from "next/link";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage === 1}
      >
        <Link href={currentPage > 1 ? buildPageUrl(currentPage - 1) : "#"}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Link>
      </Button>

      <div className="flex items-center gap-1">
        {/* Primeira página se não visível */}
        {visiblePages[0] > 1 && (
          <>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" asChild>
              <Link href={buildPageUrl(1)}>1</Link>
            </Button>
            {visiblePages[0] > 2 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {/* Páginas visíveis */}
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className="w-8 h-8 p-0"
            asChild
          >
            <Link href={buildPageUrl(page)}>{page}</Link>
          </Button>
        ))}

        {/* Última página se não visível */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" asChild>
              <Link href={buildPageUrl(totalPages)}>{totalPages}</Link>
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage === totalPages}
      >
        <Link href={currentPage < totalPages ? buildPageUrl(currentPage + 1) : "#"}>
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
