type PriceBadgeProps = {
  label: string;
  tone?: "default" | "success" | "muted";
};

export function PriceBadge({ label, tone = "default" }: PriceBadgeProps) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "muted"
        ? "border-white/8 bg-white/[0.03] text-zinc-400"
        : "border-white/10 bg-black/20 text-zinc-200";

  return <span className={`rounded-full border px-2.5 py-1 text-xs ${toneClass}`}>{label}</span>;
}
