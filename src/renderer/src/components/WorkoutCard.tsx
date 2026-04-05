type WorkoutCardProps = {
  title: string;
  focus: string;
  duration: string;
  day: string;
  intensity?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function WorkoutCard({ title, focus, duration, day, intensity, actionLabel, onAction }: WorkoutCardProps) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,27,0.95),rgba(13,13,16,0.98))] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-white" title={title}>{title}</p>
          <p className="mt-1 break-words text-sm text-zinc-400" title={focus}>{focus}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="max-w-full rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-300">{duration}</span>
          {intensity ? <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">{intensity}</span> : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="truncate text-xs uppercase tracking-[0.25em] text-zinc-500" title={day}>{day}</p>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-zinc-200"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
