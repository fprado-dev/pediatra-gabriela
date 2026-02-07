"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Home, Users, Calendar, Pill, Award } from "lucide-react";

import { cn } from "@/lib/utils";
import { NavUser } from "@/components/layout/nav-user";

type User = {
  name: string;
  email: string;
  specialty?: string | null;
  crm?: string | null;
};

const NAV = [
  { title: "Visão Geral", href: "/dashboard", icon: Home },
  { title: "Agenda", href: "/appointments", icon: Calendar },
  { title: "Consultas", href: "/consultations", icon: FileText },
  { title: "Pacientes", href: "/patients", icon: Users },
  { title: "Receitas", href: "/prescriptions/new", icon: Pill },
  { title: "Atestados", href: "/medical-certificates/new", icon: Award },
] as const;

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-svh flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <div className="relative h-10 w-10 overflow-hidden rounded-md bg-background">
          <Image src="/small-logo.png" alt="Logo" fill className="object-contain p-1" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">Pediatra Gabriela</div>
          <div className="truncate text-xs text-muted-foreground">
            Documentação Clínica
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3">
        <div className="space-y-1">
          {NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <NavUser user={user} />
    </div>
  );
}
