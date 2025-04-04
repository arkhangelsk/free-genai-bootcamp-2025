"use client";

import RecipeCard from "../components/RecipeCard";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Recipe } from "./types/recipe";
import { sanitizeJsonString } from "./utils/sanitizeJsonString";
import { STORAGE_KEY, MAX_SAVED_RECIPES } from "./constants";
import { searchRecipe } from "./services/recipeService";
import recipesData from "./data/recipes.json"; // Import recipes.json
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Home() {
  const [searchedRecipes, setSearchedRecipes] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Filter popular recipes: Hummus, Falafel, and Shawarma
  const popularRecipes = Object.values(recipesData)
    .flat() // Flatten the array of categories into a single array
    .filter((recipe) =>
      ["Hummus", "Falafel", "Shawarma"].includes(recipe.title)
    );

  // Load saved recipes on component mount
  useEffect(() => {
    try {
      const savedRecipes = localStorage.getItem(STORAGE_KEY);
      if (savedRecipes) {
        const parsed = JSON.parse(savedRecipes) as Recipe[];
        setSearchedRecipes(parsed);
      }
    } catch (error) {
      console.error("Error loading saved recipes:", error);
      setSearchError("Failed to load saved recipes");
    }
  }, []);

  const handleSearch = async (query: string) => {
    try {
      const data = await searchRecipe(query);
      return data;
    } catch (error) {
      console.error("Error searching recipe:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-green-900">
      {/* Navbar */}
      <Navbar currentCategory="Home" />

      {/* Hero Section */}
      <header className="text-center py-16 bg-yellow-50">
        <h1 className="text-4xl font-bold">
          Middle Eastern Recipes - Learn & Cook
        </h1>
        <h2 className="mt-4 text-4xl">وصفات من الشرق الأوسط - تعلَّم واطبخ</h2>
        <p className="mt-4 text-lg">
          Discover Authentic Middle Eastern Dishes While Learning Arabic.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
          <div className="flex w-full gap-2">
            <input
              type="text"
              placeholder="Search for a recipe..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full max-w-xl"
              id="recipe-search"
              disabled={isSearching}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const searchInput = document.getElementById(
                    "recipe-search"
                  ) as HTMLInputElement;
                  const query = searchInput.value.trim();
                  if (!query) return;
                  setIsSearching(true);

                  try {
                    // Sanitize the JSON string
                    const searchResult = await handleSearch(query);
                    const sanitizedJson = sanitizeJsonString(searchResult);

                    try {
                      const recipeData = JSON.parse(sanitizedJson) as Recipe;
                      setSearchedRecipes((prevRecipes) => [
                        recipeData,
                        ...prevRecipes,
                      ]);
                      searchInput.value = "";
                    } catch (parseError) {
                      console.error("JSON parse error:", parseError);
                      throw new Error(
                        "Failed to parse recipe data. Please try again."
                      );
                    }
                  } catch (error) {
                    console.error("Error searching recipe:", error);
                    alert("Failed to generate recipe. Please try again.");
                  }
                  setIsSearching(false);
                }
              }}
            />
            <button
              className={`px-6 py-2 bg-green-900 text-white rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSearching}
              onClick={async () => {
                const searchInput = document.getElementById(
                  "recipe-search"
                ) as HTMLInputElement;
                const query = searchInput.value.trim();
                if (!query) return;
                setIsSearching(true);
                setSearchError(null);

                try {
                  const showSearchResult = await handleSearch(query);
                  // Sanitize the JSON string
                  const sanitizedJson = sanitizeJsonString(showSearchResult);

                  try {
                    const recipeData: Recipe = {
                      ...JSON.parse(sanitizedJson),
                      searchedAt: new Date().toISOString(),
                    };

                    setSearchedRecipes((prevRecipes) => {
                      // Keep only the most recent MAX_SAVED_RECIPES recipes
                      const newRecipes = [recipeData, ...prevRecipes].slice(
                        0,
                        MAX_SAVED_RECIPES
                      );

                      // Save to localStorage
                      try {
                        localStorage.setItem(
                          STORAGE_KEY,
                          JSON.stringify(newRecipes)
                        );
                        // Clear any previous errors since save was successful
                        setSearchError(null);
                      } catch (error) {
                        console.error("Error saving recipes:", error);
                        setSearchError("Failed to save recipe to history");
                      }
                      return newRecipes;
                    });
                    searchInput.value = "";
                  } catch (parseError) {
                    console.error("JSON parse error:", parseError);
                    throw new Error(
                      "Failed to parse recipe data. Please try again."
                    );
                  }
                } catch (error) {
                  console.error("Error searching recipe:", error);
                  setSearchError(
                    error instanceof Error
                      ? error.message
                      : "Failed to generate recipe. Please try again."
                  );
                }
                setIsSearching(false);
              }}
            >
              {isSearching ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </button>
          </div>
          {searchError && (
            <div className="text-red-600 text-sm">{searchError}</div>
          )}
        </div>
      </header>

      {/* Recipe Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-green-900 mb-8">
          Recipe Categories فئات الوصفة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            "Appetizers المقبلات",
            "Main Dishes الأطباق الرئيسية",
            "Desserts الحلويات",
            "Beverages المشروبات",
          ].map((category) => {
            const categoryEnglish = category.split(" ")[0];
            const slugMap: { [key: string]: string } = {
              Main: "main-dishes",
              Appetizers: "appetizers",
              Desserts: "desserts",
              Beverages: "beverages",
            };
            const categorySlug =
              slugMap[categoryEnglish as keyof typeof slugMap] ||
              categoryEnglish.toLowerCase().replace(/ /g, "-");

            return (
              <div
                key={category}
                className="bg-white p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <h3 className="text-xl font-semibold text-green-900 mb-4">
                  {category}
                </h3>
                <Link href={`/category/${categorySlug}`}>
                  <button className="mt-4 bg-green-900 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors duration-300">
                    Explore
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Searched Recipes */}
      {searchedRecipes.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold">
                Searched Recipes وصفات بحثت
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {searchedRecipes.length} of {MAX_SAVED_RECIPES} maximum
                saved recipes
              </p>
            </div>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to clear your recipe history? This cannot be undone."
                  )
                ) {
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                    setSearchedRecipes([]);
                  } catch (error) {
                    console.error("Error clearing recipe history:", error);
                    setSearchError("Failed to clear recipe history");
                  }
                }
              }}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 focus:outline-none"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {searchedRecipes.map((recipe, index) => (
              <div key={`searched-${index}`} className="relative">
                <RecipeCard
                  {...recipe}
                  onClose={() => {
                    /* handle close */
                  }}
                  isModal={false} // Set isModal to false since it's not in a modal
                />
                {recipe.searchedAt && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {new Date(recipe.searchedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Recipes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">
          Popular Recipes وصفات شعبية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularRecipes.map((recipe, index) => (
            <RecipeCard
              key={index}
              {...recipe}
              onClose={() => {
                /* handle close */
              }}
              isModal={false} // Set isModal to false since it's not in a modal
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
