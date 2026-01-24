import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, crm, specialty")
    .eq("id", user.id)
    .single();

  const userData = {
    name: profile?.full_name || "Usuário",
    email: user.email || "",
    specialty: profile?.specialty ?? null,
    crm: profile?.crm ?? null,
  };

  return <AppShell user={userData}>{children}</AppShell>;
}

