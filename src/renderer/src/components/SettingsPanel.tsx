import type { SettingField } from "@/data";
import { SectionCard } from "@/components/SectionCard";

type SettingsPanelProps = {
  title: string;
  fields: SettingField[];
  values: Record<string, string>;
  onChange: (label: string, value: string) => void;
};

export function SettingsPanel({ title, fields, values, onChange }: SettingsPanelProps) {
  return (
    <SectionCard title={title}>
      <div className="grid gap-4 lg:grid-cols-2">
        {fields.map((field) => (
          <label key={field.label} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
            <span className="text-sm font-medium text-white">{field.label}</span>
            <input
              value={values[field.label] ?? field.value}
              onChange={(event) => onChange(field.label, event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
            />
            <span className="text-xs text-zinc-500">{field.hint}</span>
          </label>
        ))}
      </div>
    </SectionCard>
  );
}
