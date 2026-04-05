import {
  budgetRows,
  dashboardStats,
  mealPreview,
  progressKpis,
  recipes,
  type PageKey,
  upcomingWorkouts,
} from "@/data";
import { GroceryItemRow } from "@/components/GroceryItemRow";
import { MealCard } from "@/components/MealCard";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { WorkoutCard } from "@/components/WorkoutCard";

type DashboardPageProps = {
  onNavigate: (page: PageKey) => void;
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {dashboardStats.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard
            eyebrow="Today's Meal Plan"
            title="High protein on budget"
            action={
              <button
                type="button"
                onClick={() => onNavigate("meal-planner")}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
              >
                Edit Meals
              </button>
            }
          >
            <div className="space-y-3">
              {mealPreview.map((meal) => (
                <MealCard
                  key={meal.title}
                  type={meal.meal}
                  title={meal.title}
                  calories={meal.calories}
                  protein={meal.protein}
                  cost={meal.cost}
                  onAction={() => onNavigate("meal-planner")}
                />
              ))}
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              eyebrow="Workout Schedule"
              title="Upcoming sessions"
              action={
                <button
                  type="button"
                  onClick={() => onNavigate("workout-tracker")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                >
                  View Split
                </button>
              }
            >
              <div className="space-y-3">
                {upcomingWorkouts.map((workout) => (
                  <WorkoutCard key={workout.title} {...workout} />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Recipe Discovery"
              title="Recommended this week"
              action={
                <button
                  type="button"
                  onClick={() => onNavigate("recipes")}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
                >
                  Explore
                </button>
              }
            >
              <div className="space-y-3">
                {recipes.slice(0, 3).map((recipe) => (
                  <div key={recipe.title} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                    <p className="font-medium text-white">{recipe.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {recipe.protein} protein • {recipe.cost}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard eyebrow="Weekly Progress" title="Snapshot">
            <div className="space-y-4">
              {progressKpis.slice(0, 3).map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-zinc-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-400">{stat.label}</span>
                    <span className="text-sm text-emerald-300">{stat.change}</span>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            eyebrow="Grocery Prices"
            title="Market snapshot"
            action={
              <button
                type="button"
                onClick={() => onNavigate("grocery-budget")}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
              >
                Compare
              </button>
            }
          >
            <div className="space-y-3">
              {budgetRows.slice(0, 4).map((row) => (
                <GroceryItemRow key={row.item} {...row} />
              ))}
            </div>
          </SectionCard>

          <RecipeCard {...recipes[0]} />
        </div>
      </section>
    </>
  );
}
