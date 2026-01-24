"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/sidebar";

export type AppShellUser = {
  name: string;
  email: string;
  specialty?: string | null;
  crm?: string | null;
};

export function AppShell({
  user,
  children,
}: {
  user: AppShellUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <div className="flex min-h-svh">
        <aside className="w-64 shrink-0 border-r bg-card">
          <AppSidebar user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <h1 className="truncate text-lg font-semibold">Pediatra Gabriela</h1>
            </div>
          </header>

          <main className="min-w-0 flex-1 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}

