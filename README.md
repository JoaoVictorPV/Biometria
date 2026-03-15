## Biometria (Next.js + Supabase)

Aplicativo web **mobile-first** para registrar e acompanhar:

- Peso
- % Gordura
- % Água
- Massa magra
- IMC
- Circunferência abdominal
- Circunferência máxima do braço
- Circunferência máxima da coxa
- Pressão arterial
- Glicemia

### Tecnologias

- Next.js (App Router) + TypeScript
- TailwindCSS
- Supabase (Auth por **link mágico** + Postgres + RLS)
- Recharts (gráficos)
- Sonner (toasts)

---

## 1) Configurar Supabase

1. Crie um projeto no Supabase
2. Em **Authentication → Providers → Email**:
   - habilite **Email**
   - habilite **Magic Link**
3. No **SQL Editor**, rode o script: `supabase/schema.sql`

## 2) Variáveis de ambiente

Crie um arquivo `.env.local` (use `.env.example` como base):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://gyqybieisrvrbwzmjrdi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_QuwONR0Zp-19YGHNp5rYsQ_xAc8XzUG
NEXT_PUBLIC_DATA_MODE=online
```

### Modo LOCAL (para testar sem depender do Supabase)

Se você quiser rodar sem configurar o Supabase, defina:

```bash
NEXT_PUBLIC_DATA_MODE=local
```

Nesse modo, os dados ficam em um arquivo **.local/biometric_entries.json** (somente no seu PC).

#### Botão "Sincronizar"

No modo LOCAL aparece um botão **Sincronizar** no topo do painel.
Ele baixa todos os registros do banco online (Supabase) e **sobrescreve** a base local (apagando alterações locais).
Para funcionar, você precisa:

1. Configurar o Supabase no `.env.local`
2. Entrar em `/auth` (link mágico)

## 3) Rodar local

```bash
npm install
npm run dev
```

Abra: http://localhost:3000

## 4) Deploy na Vercel

1. Suba este repositório no GitHub
2. Na Vercel, importe o repo
3. Em **Settings → Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://gyqybieisrvrbwzmjrdi.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_QuwONR0Zp-19YGHNp5rYsQ_xAc8XzUG`
   - `NEXT_PUBLIC_DATA_MODE` = `online`
4. Deploy

### Importante (Magic Link)

No Supabase, configure:

**Authentication → URL Configuration**

- **Site URL**:
  - `https://biometria-mu.vercel.app`
- **Redirect URLs / Additional Redirect URLs**:
  - `https://biometria-mu.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

---

### Observações importantes

- Cada usuário enxerga **apenas** seus próprios registros (RLS com `auth.uid()`)
- Campos são **opcionais** — você preenche só o que quiser
- Sem popups nativos (alert/confirm): mensagens via toast

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
