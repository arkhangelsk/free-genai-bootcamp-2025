"use client";
import React from "react";
import { useParams } from "next/navigation";
import RecipeCard from "../../../components/RecipeCard";
import recipes from "../../data/recipes.json"; // Import the new JSON file
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

// Helper function to format the category name
const formatCategoryName = (category: string) => {
  return category
    .replace(/-/g, " ") // Replace hyphens with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word
};

export default function CategoryPage() {
  const { category } = useParams(); // Get the category from the URL

  // Format the category name for display
  const formattedCategory = formatCategoryName(category as string);

  // Get the recipes for the current category
  const categoryRecipes = recipes[category as keyof typeof recipes] || [];

  return (
    <div className="min-h-screen bg-gray-100 text-green-900">
      {/* Navbar */}
      <Navbar currentCategory={category as string} />

      {/* Hero Section */}
      <header className="text-center py-16 bg-yellow-50">
        <h1 className="text-4xl font-bold capitalize">{formattedCategory}</h1>
        <p className="mt-4 text-lg">Discover delicious {category} recipes.</p>
      </header>

      {/* Featured Recipes */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categoryRecipes.map((recipe) => (
            <div key={recipe.title} className="relative">
              {/* Render the RecipeCard directly */}
              <RecipeCard
                {...recipe}
                onClose={() => {}} // No need for onClose since it's not a modal
                isModal={false} // Set isModal to false
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
