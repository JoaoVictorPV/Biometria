import { cn } from "@/lib/utils/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0ea5e9" stopOpacity="0.9" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* anel externo */}
      <circle
        cx="24"
        cy="24"
        r="18"
        fill="none"
        stroke="url(#g1)"
        strokeWidth="2.2"
        filter="url(#glow)"
        opacity="0.95"
      />

      {/* "check" de saúde + trilha */}
      <path
        d="M14 25.5c3.5-6.5 6.5-6.5 10 0 2.2 4.2 4.6 4.2 7.8-0.5"
        fill="none"
        stroke="url(#g2)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* ponto / “registro” */}
      <circle cx="34" cy="25" r="2.6" fill="url(#g1)" opacity="0.95" />
      <circle cx="34" cy="25" r="1.1" fill="#0b1020" opacity="0.55" />
    </svg>
  );
}
