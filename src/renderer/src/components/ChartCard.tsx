type ChartCardProps = {
  title: string;
  subtitle: string;
};

export function ChartCard({ title, subtitle }: ChartCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
      <p className="text-sm text-zinc-400">{subtitle}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>

      <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-zinc-900/60 p-6">
        <div className="flex h-56 items-end gap-3">
          {[52, 70, 60, 88, 74, 96, 82, 108].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-2xl bg-emerald-400/60" style={{ height }} />
          ))}
        </div>
      </div>
    </div>
  );
}
