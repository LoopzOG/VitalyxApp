import { useEffect, useMemo, useState } from "react";
import { createInitialPlanner, type PlannerDay } from "@/data";
import { MealCard } from "@/components/MealCard";
import { SectionCard } from "@/components/SectionCard";
import { listenForPageActions } from "@/lib/pageActions";

function parseProtein(value: string) {
  return Number.parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
}

function parseCost(value: string) {
  return Number.parseFloat(value.replace("$", "")) || 0;
}

function nextMealType(count: number) {
  const order = ["Breakfast", "Lunch", "Dinner", "Snack"];
  return order[count % order.length];
}

type MealPlannerPageProps = {
  planner: PlannerDay[];
  onPlannerChange: (planner: PlannerDay[]) => void;
};

export function MealPlannerPage({ planner, onPlannerChange }: MealPlannerPageProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(planner[1] ? 1 : (planner[0] ? 0 : null));
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [draftDayName, setDraftDayName] = useState(planner[1]?.day ?? "");
  const [draftDayNote, setDraftDayNote] = useState(planner[1]?.note ?? "");

  const selectedDay = selectedDayIndex === null ? null : planner[selectedDayIndex] ?? null;

  useEffect(() => {
    if (selectedDayIndex === null) {
      return;
    }

    if (!planner[selectedDayIndex]) {
      setSelectedDayIndex(planner[0] ? 0 : null);
      setIsEditingDay(false);
      return;
    }

    setDraftDayName(planner[selectedDayIndex].day);
    setDraftDayNote(planner[selectedDayIndex].note);
  }, [planner, selectedDayIndex]);

  const selectedTotals = useMemo(
    () =>
      (selectedDay?.meals ?? []).reduce(
        (acc, meal) => {
          acc.calories += meal.calories;
          acc.cost += parseCost(meal.cost);
          acc.protein += parseProtein(meal.protein);
          return acc;
        },
        { calories: 0, cost: 0, protein: 0 },
      ),
    [selectedDay],
  );
  const weekTotals = useMemo(() => {
    const mealCount = planner.reduce((sum, day) => sum + day.meals.length, 0);
    const calories = planner.reduce(
      (sum, day) => sum + day.meals.reduce((daySum, meal) => daySum + meal.calories, 0),
      0,
    );
    const protein = planner.reduce(
      (sum, day) => sum + day.meals.reduce((daySum, meal) => daySum + parseProtein(meal.protein), 0),
      0,
    );
    const cost = planner.reduce(
      (sum, day) => sum + day.meals.reduce((daySum, meal) => daySum + parseCost(meal.cost), 0),
      0,
    );

    return {
      mealCount,
      avgCalories: Math.round(calories / planner.length),
      avgProtein: Math.round(protein / planner.length),
      avgCost: cost / planner.length,
    };
  }, [planner]);

  function syncDayDraft(index: number) {
    setDraftDayName(planner[index].day);
    setDraftDayNote(planner[index].note);
  }

  function selectDay(index: number) {
    if (selectedDayIndex === index) {
      setSelectedDayIndex(null);
      setIsEditingDay(false);
      return;
    }

    setSelectedDayIndex(index);
    setIsEditingDay(false);
    syncDayDraft(index);
  }

  function addMeal(dayIndex: number) {
    const nextPlanner = planner.map((day, index) => {
        if (index !== dayIndex) return day;

        const mealType = nextMealType(day.meals.length);
        return {
          ...day,
          meals: [
            ...day.meals,
            {
              type: mealType,
              title: `New ${mealType}`,
              calories: 450,
              protein: "30g",
              cost: "$4.50",
            },
          ],
        };
      });
    onPlannerChange(nextPlanner);
    if (dayIndex !== selectedDayIndex) {
      selectDay(dayIndex);
    }
  }

  function removeMeal(dayIndex: number, mealIndex: number) {
    onPlannerChange(
      planner.map((day, index) => {
        if (index !== dayIndex) return day;
        return {
          ...day,
          meals: day.meals.filter((_, indexToRemove) => indexToRemove !== mealIndex),
        };
      }),
    );
  }

  function saveDayEdits() {
    if (selectedDayIndex === null) {
      return;
    }

    onPlannerChange(
      planner.map((day, index) =>
        index === selectedDayIndex
          ? {
              ...day,
              day: draftDayName.trim() || day.day,
              note: draftDayNote.trim() || day.note,
            }
          : day,
      ),
    );
    setIsEditingDay(false);
  }

  function resetWeek() {
    const nextPlanner = createInitialPlanner();
    onPlannerChange(nextPlanner);
    setSelectedDayIndex(1);
    setDraftDayName(nextPlanner[1]?.day ?? "");
    setDraftDayNote(nextPlanner[1]?.note ?? "");
    setIsEditingDay(false);
  }

  function duplicateWeek() {
    if (!selectedDay) {
      return;
    }

    const sourceMeals = selectedDay.meals.map((meal) => ({ ...meal }));
    onPlannerChange(
      planner.map((day) => ({
        ...day,
        meals: sourceMeals.map((meal) => ({ ...meal })),
      })),
    );
    setIsEditingDay(false);
  }

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "meal-planner") {
          return;
        }
        if (action === "add-meal") {
          addMeal(selectedDayIndex ?? 0);
        }
        if (action === "duplicate-week") {
          duplicateWeek();
        }
      }),
    [planner, selectedDay, selectedDayIndex],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-zinc-400">Planned meals</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{weekTotals.mealCount}</p>
          <p className="mt-2 text-sm text-emerald-300">Live total across your week</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-zinc-400">Avg daily calories</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{weekTotals.avgCalories}</p>
          <p className="mt-2 text-sm text-zinc-400">Easy to tune for a lean bulk target</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-zinc-400">Avg protein</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{weekTotals.avgProtein}g</p>
          <p className="mt-2 text-sm text-zinc-400">Ready for macro adjustments later</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm text-zinc-400">Estimated daily cost</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">${weekTotals.avgCost.toFixed(2)}</p>
          <p className="mt-2 text-sm text-emerald-300">Keeps weekly budget predictable</p>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.5fr_0.7fr]">
        <SectionCard
          eyebrow="Weekly Meal Planner"
          title="Seven-day nutrition schedule"
          className="overflow-hidden"
          action={
            <button
              onClick={() => addMeal(selectedDayIndex ?? 0)}
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Add Meal
            </button>
          }
        >
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Balanced week overview</p>
              <p className="mt-1 text-sm text-zinc-400">Cleaner column spacing and lighter meal blocks for easier scanning.</p>
            </div>
            <button
              onClick={resetWeek}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
            >
              Reset week
            </button>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="grid min-w-[1260px] grid-cols-7 gap-5">
              {planner.map((column, columnIndex) => (
                <div
                  key={`${column.day}-${columnIndex}`}
                  onClick={() => selectDay(columnIndex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectDay(columnIndex);
                    }
                  }}
                  className={`flex min-h-[560px] flex-col rounded-[28px] border p-4 text-left transition ${
                    columnIndex === selectedDayIndex
                      ? "border-emerald-400/50 bg-zinc-900/70 shadow-[0_0_0_1px_rgba(52,211,153,0.15)]"
                      : "border-white/10 bg-zinc-900/45 hover:border-white/20 hover:bg-zinc-900/55"
                  }`}
                >
                  <div className="mb-4 border-b border-white/8 pb-4 text-left">
                    <p className="text-base font-semibold text-white">{column.day}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{column.meals.length} planned meals</p>
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                        {column.meals.reduce((sum, meal) => sum + meal.calories, 0)} cal
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {column.meals.map((meal, mealIndex) => (
                      <MealCard
                        key={`${column.day}-${meal.type}-${mealIndex}`}
                        {...meal}
                        compact
                        showAction={false}
                      />
                    ))}
                  </div>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      addMeal(columnIndex);
                    }}
                    className="mt-auto rounded-2xl border border-dashed border-white/10 bg-white/3 px-3 py-3 text-center text-sm text-zinc-400 hover:bg-white/5"
                  >
                    + Add meal block
                  </button>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Selected Day"
          title={selectedDay ? `${selectedDay.day} details` : "Day details"}
          className="h-fit"
          action={
            selectedDay ? (
              isEditingDay ? (
                <button
                  onClick={saveDayEdits}
                  className="rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-zinc-950"
                >
                  Save Day
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (selectedDayIndex === null) {
                      return;
                    }
                    syncDayDraft(selectedDayIndex);
                    setIsEditingDay(true);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
                >
                  Edit Day
                </button>
              )
            ) : null
          }
        >
          <div className="space-y-5">
            {selectedDay ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Meals</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedDay.meals.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Calories</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedTotals.calories}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Protein</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedTotals.protein}g</p>
                  </div>
                </div>

                {isEditingDay ? (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Day label</span>
                  <input
                    value={draftDayName}
                    onChange={(event) => setDraftDayName(event.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-white">Day note</span>
                  <textarea
                    value={draftDayNote}
                    onChange={(event) => setDraftDayNote(event.target.value)}
                    rows={4}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
                  />
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={saveDayEdits}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-zinc-950"
                  >
                    Save edits
                  </button>
                   <button
                     onClick={() => {
                       if (selectedDayIndex === null) {
                         return;
                       }
                       syncDayDraft(selectedDayIndex);
                       setIsEditingDay(false);
                     }}
                     className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-400">Day note</p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{selectedDay.note}</p>
              </div>
            )}

            <div className="space-y-3">
              {selectedDay.meals.map((meal, mealIndex) => (
                <div key={`${meal.type}-${mealIndex}`} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-400">{meal.type}</p>
                      <p className="mt-1 text-base font-medium text-white">{meal.title}</p>
                    </div>
                    <button
                      onClick={() => removeMeal(selectedDayIndex ?? 0, mealIndex)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">{meal.calories} cal</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-300">{meal.protein}</span>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-300">{meal.cost}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm leading-7 text-zinc-400">
              Add Meal, Remove, Edit Day, and Reset week are now working directly against local planner state so you can prototype the planning flow without backend wiring yet.
            </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm leading-7 text-zinc-400">
                Tap any day cell to open its details. Tap the same cell again to close it.
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
