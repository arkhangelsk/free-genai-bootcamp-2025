"use client";
import React, { useState } from "react";
import RecipeCard from "../../components/RecipeCard";
import { searchRecipe } from "../services/recipeService";
import { sanitizeJsonString } from "../utils/sanitizeJsonString";
import { Recipe } from "../types/recipe";

export default function Appetizers() {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null); // Track which recipe is loading
  const [error, setError] = useState<string | null>(null);

  const handleViewRecipe = async (title: string) => {
    setLoadingRecipe(title); // Set the currently loading recipe
    setError(null);

    try {
      // Fetch recipe details from the locally running LLM
      const searchResult = await searchRecipe(title);
      const sanitizedJson = sanitizeJsonString(searchResult);

      // Parse the sanitized JSON string into a Recipe object
      const recipeData = JSON.parse(sanitizedJson) as Recipe;
      setSelectedRecipe(recipeData);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      setError("Failed to fetch recipe details. Please try again.");
    } finally {
      setLoadingRecipe(null); // Reset loading state
    }
  };

  const handleCloseRecipe = () => {
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-green-900">
      {/* Hero Section */}
      <header className="text-center py-16 bg-yellow-50">
        <h1 className="text-4xl font-bold">Appetizers</h1>
        <p className="mt-4 text-lg">
          Start your meal with these delicious bites.
        </p>
      </header>

      {/* Featured Appetizer Recipes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">
          Featured Appetizer Recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Hummus حمص",
            "Baba Ghanoush بابا غنوج",
            "Falafel فلافل",
            "Muhammara محمرة",
            "Labneh لبنة",
            "Kibbeh كبة",
            "Sambousek سمبوسك",
            "Fattoush فتوش",
            "Tabbouleh تبولة",
            "Manakish مناقيش",
            "Dolma (Warak Enab) ورق عنب",
            "Arayes عرايس",
          ].map((appetizer) => (
            <div
              key={appetizer}
              className="bg-white p-6 rounded-lg shadow-lg text-center"
            >
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                {appetizer}
              </h3>
              <button
                className="mt-4 bg-green-900 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors duration-300"
                onClick={() => handleViewRecipe(appetizer)}
                disabled={loadingRecipe === appetizer} // Disable button while loading
              >
                {loadingRecipe === appetizer ? "Loading..." : "View Recipe"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Render the RecipeCard if a recipe is selected */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-screen">
            <RecipeCard {...selectedRecipe} onClose={handleCloseRecipe} />
          </div>
        </div>
      )}

      {/* Display error message if any */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 bg-gray-800 text-white mt-12">
        <p>&copy; 2025 Middle Eastern Recipes. All rights reserved.</p>
      </footer>
    </div>
  );
}