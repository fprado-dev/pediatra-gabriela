"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Home, LogOut, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type User = {
  name: string;
  email: string;
  specialty?: string | null;
  crm?: string | null;
};

const NAV = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Consultas", href: "/consultations", icon: FileText },
  { title: "Pacientes", href: "/patients", icon: Users },
] as const;

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = React.useMemo(() => {
    const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return (first + second).toUpperCase();
  }, [user.name]);

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

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

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {user.specialty || "Médico"}
              {user.crm ? ` • CRM ${user.crm}` : ""}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          <Button asChild variant="outline" className="justify-start">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>

          <Button variant="destructive" className="justify-start" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

