"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/sidebar";
import { TimerWidget } from "@/components/timers";

export type AppShellUser = {
  id: string;
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
    <div className="min-h-svh bg-gray-50 ">
      <div className="flex min-h-svh">
        <aside className="w-64 shrink-0 border-r sticky top-0 left-0 h-screen">
          <AppSidebar user={user} />
        </aside>

        <div className="flex flex-1 flex-col max-w-7xl mx-auto  ">
          <main className="flex-1 py-8 ">{children}</main>
        </div>
      </div>
    </div>
  );
}

