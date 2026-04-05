import { useEffect, useMemo, useState } from "react";
import { budgetSettings, fitnessSettings, nutritionSettings, profileSettings } from "@/data";
import { SectionCard } from "@/components/SectionCard";
import { SettingsPanel } from "@/components/SettingsPanel";
import { listenForPageActions } from "@/lib/pageActions";

const toggleLabels = [
  "Price alerts",
  "Weekly meal prep reminders",
  "Workout streak notifications",
  "Auto-generate shopping list",
];

function buildDefaultValues() {
  return Object.fromEntries(
    [...profileSettings, ...nutritionSettings, ...fitnessSettings, ...budgetSettings].map((field) => [
      field.label,
      field.value,
    ]),
  );
}

function buildDefaultToggles() {
  return {
    [toggleLabels[0]]: true,
    [toggleLabels[1]]: false,
    [toggleLabels[2]]: true,
    [toggleLabels[3]]: true,
  };
}

export function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>(() => buildDefaultValues());
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => buildDefaultToggles());
  const [status, setStatus] = useState("Change any field, then use Save Changes to confirm the update.");

  const panels = useMemo(
    () => [
      { title: "Profile & Preferences", fields: profileSettings },
      { title: "Nutrition Goals", fields: nutritionSettings },
      { title: "Fitness Goals", fields: fitnessSettings },
      { title: "Budget Controls", fields: budgetSettings },
    ],
    [],
  );

  function handleFieldChange(label: string, value: string) {
    setValues((current) => ({ ...current, [label]: value }));
  }

  function toggleSetting(label: string) {
    setToggles((current) => ({ ...current, [label]: !current[label] }));
  }

  function saveSettings() {
    setStatus("Settings saved locally for this session.");
  }

  function resetSettings() {
    setValues(buildDefaultValues());
    setToggles(buildDefaultToggles());
    setStatus("Settings reset to their defaults.");
  }

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "settings") {
          return;
        }
        if (action === "save-settings") {
          saveSettings();
        }
        if (action === "reset-settings") {
          resetSettings();
        }
      }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
        {status}
      </div>

      {panels.map((panel) => (
        <SettingsPanel
          key={panel.title}
          title={panel.title}
          fields={panel.fields}
          values={values}
          onChange={handleFieldChange}
        />
      ))}

      <SectionCard title="Automation & Toggles">
        <div className="grid gap-4 lg:grid-cols-2">
          {toggleLabels.map((toggle) => (
            <div
              key={toggle}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/60 p-4"
            >
              <div>
                <p className="font-medium text-white">{toggle}</p>
                <p className="mt-1 text-sm text-zinc-400">Keep this workflow enabled across web, desktop, and mobile.</p>
              </div>
              <button
                type="button"
                onClick={() => toggleSetting(toggle)}
                className={`flex h-7 w-12 items-center rounded-full p-1 ${
                  toggles[toggle] ? "justify-end bg-emerald-400/80" : "justify-start bg-white/10"
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-white" />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
