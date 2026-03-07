import { createClient } from "@/app/lib/supabase/client";

export async function ensureAnonymousSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    await supabase.auth.signInAnonymously();
  }
}
