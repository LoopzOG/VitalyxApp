type FilterChipGroupProps = {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export function FilterChipGroup({ label, options, selected, onSelect }: FilterChipGroupProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-full border px-3 py-2 text-xs font-medium ${
                isActive
                  ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
                  : "border-white/10 bg-black/20 text-zinc-300"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
