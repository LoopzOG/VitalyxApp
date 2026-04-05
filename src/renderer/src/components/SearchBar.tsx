import { Search } from "lucide-react";

type SearchBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  value = "",
  onChange,
  placeholder = "Search recipes, workouts, foods...",
  className = "",
}: SearchBarProps) {
  return (
    <label
      className={`flex w-full items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.045] px-4 py-3 text-sm text-zinc-300 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur ${className}`}
    >
      <Search size={17} className="text-zinc-500" />
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full border-0 bg-transparent p-0 text-white outline-none placeholder:text-zinc-500"
        placeholder={placeholder}
      />
    </label>
  );
}
