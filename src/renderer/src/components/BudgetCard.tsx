type BudgetCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function BudgetCard({ label, value, detail }: BudgetCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</h3>
      <p className="mt-2 text-sm text-emerald-300">{detail}</p>
    </div>
  );
}
