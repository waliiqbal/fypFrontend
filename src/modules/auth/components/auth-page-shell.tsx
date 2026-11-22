import type { ReactNode } from "react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthPageShell({ eyebrow, title, description, children }: AuthPageShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_50%_-20%,_#d4f4f0_0%,_#ecf8f7_45%,_transparent_74%)]" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-white/90 bg-white/90 p-6 shadow-[0_25px_80px_rgba(28,65,69,0.12)] backdrop-blur sm:p-9">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-brand-soft to-brand shadow-lg shadow-brand/15">
          <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
            <path d="M27 12h10v13h13v10H37v13H27V35H14V25h13V12Z" fill="white" />
            <path d="M11 51c8-5 14-5 22-2 8 3 13 1 20-5" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-[-0.04em] text-slate-900">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-7">{children}</div>
      </section>
    </main>
  );
}
