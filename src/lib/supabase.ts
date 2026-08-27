import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Lazy on purpose: this file is imported by client components that Next.js
// still evaluates while collecting build/page data, even for dynamic routes.
// Creating the client eagerly at module scope throws the build if the env
// vars aren't set at build time (they only need to exist at runtime here).
export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
