import { createClient } from "@supabase/supabase-js";

// Read from Vite env (must be prefixed with VITE_)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are not set. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
