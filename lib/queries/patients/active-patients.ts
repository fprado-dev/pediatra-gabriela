import { User } from "@supabase/supabase-js";
import { ActivePatients } from "./types";
import { createClient } from "@/lib/supabase/server";

export async function getActivePatients(user: User): Promise<ActivePatients> {
  const supabase = await createClient();


  const { count, error } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching active patients:", error);
    throw error;
  }

  return { totalActivePatients: count || 0 };
}
