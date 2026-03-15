import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { InfoBar } from "@/components/info/info-bar";
import { ExportButton } from "@/components/export/export-button";
import { BrandMark } from "@/components/brand/brand-mark";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800/60 dark:bg-black/40">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <BrandMark />
            <span>Biometria</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <ExportButton />

            <form action="/auth/signout" method="post">
              <Button variant="secondary" size="sm" type="submit" title="Sair">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </form>

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
