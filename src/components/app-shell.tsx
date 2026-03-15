import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { InfoBar } from "@/components/info/info-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800/60 dark:bg-black/40">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            Biometria
          </Link>
          <nav className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <Link
              href="/"
              className="rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Painel
            </Link>
            <Link
              href="/app/account"
              className="rounded-lg px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Conta
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <InfoBar />

      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>

      <footer className="mx-auto w-full max-w-5xl px-4 pt-4 pb-10 text-xs text-zinc-500 dark:text-zinc-500">
        <p>Dados privados — cada usuário vê apenas seus registros.</p>
      </footer>
    </div>
  );
}
