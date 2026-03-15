import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_DATA_MODE: z.enum(["online", "local"]).optional(),
});

const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_DATA_MODE: process.env.NEXT_PUBLIC_DATA_MODE,
});

export type AppEnv = z.infer<typeof EnvSchema>;

export const env: AppEnv | null = parsed.success ? parsed.data : null;

export function hasSupabaseEnv() {
  return Boolean(env?.NEXT_PUBLIC_SUPABASE_URL && env?.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function requireSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase não configurado. Crie um .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (veja .env.example).",
    );
  }
  return {
    url: env!.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env!.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}
