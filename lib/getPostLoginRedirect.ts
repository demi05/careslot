import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** Patients land on the patient dashboard; any staff role lands in /staff. */
export async function getPostLoginRedirect(supabase: SupabaseClient<Database>, userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data && data.role !== "patient" ? "/staff/dashboard" : "/dashboard";
}
