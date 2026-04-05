import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, eyebrow, action, children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,27,0.92),rgba(14,14,18,0.96))] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.28)] ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{eyebrow}</p> : null}
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
