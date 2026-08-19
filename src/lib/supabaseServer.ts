import { createClient } from '@supabase/supabase-js';

// Server‑only Supabase client using the service‑role key
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
