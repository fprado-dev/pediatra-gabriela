"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick?: () => void;
}

export function BackButton({ onClick }: BackButtonProps = {}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Button>
  );
}
