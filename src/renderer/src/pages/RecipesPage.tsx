import { useEffect, useMemo, useState } from "react";
import { recipes as initialRecipes, type RecipeItem } from "@/data";
import { RecipeCard } from "@/components/RecipeCard";
import { SectionCard } from "@/components/SectionCard";
import { listenForPageActions } from "@/lib/pageActions";

const filters = ["All", "High Protein", "Budget", "Meal Prep", "Quick", "Dinner", "Breakfast"];

const importedRecipe: RecipeItem = {
  title: "Imported Citrus Chicken Bowl",
  calories: 540,
  protein: "44g",
  cost: "$5.85",
  tags: ["Meal Prep", "High Protein"],
  cuisine: "Fusion",
  difficulty: "Easy",
};

export function RecipesPage() {
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [recipeList, setRecipeList] = useState<RecipeItem[]>(initialRecipes);
  const [selectedRecipeTitle, setSelectedRecipeTitle] = useState(initialRecipes[2]?.title ?? initialRecipes[0].title);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [status, setStatus] = useState("Choose a filter or click any recipe card to inspect it.");

  const visibleRecipes = useMemo(() => {
    if (selectedFilter === "All") {
      return recipeList;
    }
    return recipeList.filter((recipe) => recipe.tags.includes(selectedFilter));
  }, [recipeList, selectedFilter]);

  const selectedRecipe =
    visibleRecipes.find((recipe) => recipe.title === selectedRecipeTitle) ??
    recipeList.find((recipe) => recipe.title === selectedRecipeTitle) ??
    visibleRecipes[0] ??
    recipeList[0];

  function importRecipe() {
    setRecipeList((current) => {
      if (current.some((recipe) => recipe.title === importedRecipe.title)) {
        return current;
      }
      return [importedRecipe, ...current];
    });
    setSelectedRecipeTitle(importedRecipe.title);
    setStatus("Imported a demo recipe into your browser list.");
  }

  function saveRecipe() {
    if (!selectedRecipe) {
      return;
    }
    setSavedRecipes((current) =>
      current.includes(selectedRecipe.title) ? current : [...current, selectedRecipe.title],
    );
    setStatus(`${selectedRecipe.title} is saved for later.`);
  }

  useEffect(() => {
    if (visibleRecipes.length && !visibleRecipes.some((recipe) => recipe.title === selectedRecipeTitle)) {
      setSelectedRecipeTitle(visibleRecipes[0].title);
    }
  }, [selectedRecipeTitle, visibleRecipes]);

  useEffect(
    () =>
      listenForPageActions(({ page, action }) => {
        if (page !== "recipes") {
          return;
        }
        if (action === "save-recipe") {
          saveRecipe();
        }
        if (action === "import-recipe") {
          importRecipe();
        }
      }),
    [selectedRecipe],
  );

  return (
    <div className="space-y-6">
      <SectionCard eyebrow="Recipe Browser" title="Search and compare recipes">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
            Search high-protein recipes, ingredients, tags, or prep styles
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`rounded-full px-3 py-2 text-sm ${
                  filter === selectedFilter
                    ? "bg-emerald-400 text-zinc-950"
                    : "border border-white/10 bg-white/5 text-zinc-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {status}
          </div>

          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {visibleRecipes.map((recipe) => (
              <button
                key={recipe.title}
                type="button"
                onClick={() => {
                  setSelectedRecipeTitle(recipe.title);
                  setStatus(`Viewing ${recipe.title}.`);
                }}
                className={`rounded-[28px] text-left transition ${
                  recipe.title === selectedRecipe?.title ? "ring-2 ring-emerald-400/60" : ""
                }`}
              >
                <RecipeCard {...recipe} />
              </button>
            ))}
          </div>
        </div>

        <SectionCard eyebrow="Recipe Detail" title={selectedRecipe.title}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <p className="text-sm text-zinc-400">Overview</p>
              <p className="mt-2 leading-7 text-zinc-200">
                {selectedRecipe.title} is organized for repeatable prep, strong protein coverage, and grocery-friendly ingredients.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-400">Calories</p>
                <p className="mt-2 text-2xl font-semibold text-white">{selectedRecipe.calories}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
                <p className="text-sm text-zinc-400">Protein</p>
                <p className="mt-2 text-2xl font-semibold text-white">{selectedRecipe.protein}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-sm text-zinc-400">
              Saved recipes: {savedRecipes.length}. Import Recipe adds a demo card, and Save Recipe stores the currently selected one for this session.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
