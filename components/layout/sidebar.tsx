"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Stethoscope,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Pacientes",
    href: "/dashboard/patients",
    icon: Users,
  },
  {
    name: "Consultas",
    href: "/dashboard/consultations",
    icon: FileText,
    disabled: true, // Ainda não implementado
  },
  {
    name: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Stethoscope className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Pediatra Gabriela</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          if (item.disabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                <span className="ml-auto text-xs">(Em breve)</span>
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          v0.2.0 - Módulo de Pacientes
        </p>
      </div>
    </div>
  );
}
