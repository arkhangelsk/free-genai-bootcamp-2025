"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import RecipeCard from "../../../components/RecipeCard";
import { searchRecipe } from "../../services/recipeService";
import { sanitizeJsonString } from "../../utils/sanitizeJsonString";
import { Recipe } from "../../types/recipe";
import recipes from "../../data/recipes.json";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function CategoryPage() {
  const { category } = useParams(); // Get the category from the URL
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get the recipes for the current category
  const categoryRecipes = recipes[category as keyof typeof recipes] || [];

  const handleViewRecipe = async (title: string) => {
    setLoadingRecipe(title);
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
      setLoadingRecipe(null);
    }
  };

  const handleCloseRecipe = () => {
    setSelectedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-green-900">
      {/* Navbar */}
      <Navbar currentCategory={category as string} />

      {/* Hero Section */}
      <header className="text-center py-16 bg-yellow-50">
        <h1 className="text-4xl font-bold capitalize">{category}</h1>
        <p className="mt-4 text-lg">Discover delicious {category} recipes.</p>
      </header>

      {/* Featured Recipes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">
          Featured {category} Recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categoryRecipes.map((recipe) => (
            <div
              key={recipe}
              className="bg-white p-6 rounded-lg shadow-lg text-center"
            >
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                {recipe}
              </h3>
              <button
                className={`mt-4 px-6 py-2 text-white rounded-lg transition-colors duration-300 ${
                  loadingRecipe === recipe
                    ? "bg-amber-600" // Apply amber background when loading
                    : "bg-green-900 hover:bg-amber-600" // Default green background with hover effect
                }`}
                onClick={() => handleViewRecipe(recipe)}
                disabled={loadingRecipe === recipe}
              >
                {loadingRecipe === recipe ? "Loading..." : "View Recipe"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Render the RecipeCard if a recipe is selected */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto max-h-screen">
            <RecipeCard
              {...selectedRecipe}
              onClose={handleCloseRecipe}
              isModal={true}
            />
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
      <Footer />
    </div>
  );
}