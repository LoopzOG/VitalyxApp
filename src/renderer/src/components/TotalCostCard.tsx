type TotalCostCardProps = {
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
};

export function TotalCostCard({ label, value, detail, highlight = false }: TotalCostCardProps) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        highlight
          ? "border-emerald-400/20 bg-emerald-400/10"
          : "border-white/8 bg-white/[0.04]"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${highlight ? "text-emerald-100" : "text-white"}`}>{value}</p>
      <p className={`mt-2 text-sm ${highlight ? "text-emerald-100/80" : "text-zinc-400"}`}>{detail}</p>
    </div>
  );
}
