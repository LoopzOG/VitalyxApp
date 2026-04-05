type PriceConfidenceIndicatorProps = {
  score?: number;
};

export function PriceConfidenceIndicator({ score = 0 }: PriceConfidenceIndicatorProps) {
  const label = score >= 0.9 ? "High confidence" : score >= 0.8 ? "Medium confidence" : score > 0 ? "Low confidence" : "No confidence";
  const activeCount = score >= 0.9 ? 3 : score >= 0.8 ? 2 : score > 0 ? 1 : 0;

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full ${index < activeCount ? "bg-emerald-300" : "bg-white/10"}`}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
