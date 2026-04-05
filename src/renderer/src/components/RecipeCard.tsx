type RecipeCardProps = {
  title: string;
  calories: number;
  protein: string;
  cost: string;
  tags: string[];
  cuisine: string;
  difficulty: string;
};

export function RecipeCard({
  title,
  calories,
  protein,
  cost,
  tags,
  cuisine,
  difficulty,
}: RecipeCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{cuisine}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
          {difficulty}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">{calories} cal</span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">{protein}</span>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-300">{cost}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
