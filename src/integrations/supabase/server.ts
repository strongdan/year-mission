import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, hasSupabaseConfig } from "@/lib/env";

export async function createServerClientForApp() {
  if (!hasSupabaseConfig) {
    return null;
  }
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component. Safe to ignore when middleware
          // is refreshing sessions.
        }
      },
    },
  });
}

export function createServerClientForMiddleware(request: Request) {
  if (!hasSupabaseConfig) {
    return null;
  }
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const response = new Response();
  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get("cookie") ?? "";
        return cookieHeader.split(";").map((pair) => {
          const [name, ...rest] = pair.split("=");
          return { name: name.trim(), value: rest.join("=").trim() };
        });
      },
      setAll(cookiesToSet, headers) {
        const setCookieHeaders = headers["Set-Cookie"] ?? headers["set-cookie"];
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookie = `${name}=${value}`;
          const attrs: string[] = [];
          if (options?.maxAge !== undefined) attrs.push(`Max-Age=${options.maxAge}`);
          if (options?.path) attrs.push(`Path=${options.path}`);
          if (options?.httpOnly) attrs.push("HttpOnly");
          if (options?.sameSite) attrs.push(`SameSite=${options.sameSite}`);
          if (options?.secure) attrs.push("Secure");
          response.headers.append("Set-Cookie", attrs.length ? `${cookie}; ${attrs.join("; ")}` : cookie);
        });
        if (setCookieHeaders) {
          response.headers.set("Set-Cookie", String(setCookieHeaders));
        }
      },
    },
  });
  return { client, response };
}

export async function createAdminClient() {
  if (!hasSupabaseConfig || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}