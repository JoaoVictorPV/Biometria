import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabaseEnv, requireSupabaseEnv } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const response = NextResponse.redirect(new URL("/", url.origin));

  if (!hasSupabaseEnv()) return response;
  if (!code) return response;

  const { url: supabaseUrl, anonKey } = requireSupabaseEnv();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.headers.get("cookie")
          ? request.headers
              .get("cookie")!
              .split(";")
              .map((c) => c.trim())
              .filter(Boolean)
              .map((c) => {
                const [name, ...rest] = c.split("=");
                return { name, value: rest.join("=") };
              })
          : [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
