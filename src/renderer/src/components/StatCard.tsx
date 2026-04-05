import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon?: LucideIcon;
  emphasis?: "default" | "accent";
};

export function StatCard({ label, value, detail, icon: Icon, emphasis = "default" }: StatCardProps) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(28,28,33,0.92),rgba(16,16,20,0.98))] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        {Icon ? (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              emphasis === "accent" ? "bg-emerald-400/16 text-emerald-300" : "bg-white/6 text-zinc-300"
            }`}
          >
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</h3>
      <p className={`mt-2 text-sm ${emphasis === "accent" ? "text-emerald-300" : "text-zinc-400"}`}>{detail}</p>
    </div>
  );
}
