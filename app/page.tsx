import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  Benefits,
  Testimonials,
  Pricing,
  FAQ,
  CTAWaitlist,
  Footer,
} from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Verificar se o usuário está autenticado
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se autenticado, redirecionar para o dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Se não autenticado, mostrar landing page
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTAWaitlist />
      <Footer />
    </main>
  );
}
