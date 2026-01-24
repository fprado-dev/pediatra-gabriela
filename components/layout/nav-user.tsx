"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type NavUserProps = {
  user: {
    name: string;
    email: string;
    specialty?: string | null;
    crm?: string | null;
  };
};

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const supabase = createClient();

  const initials = React.useMemo(() => {
    const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return (first + second).toUpperCase();
  }, [user.name]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
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
        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          className="justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
