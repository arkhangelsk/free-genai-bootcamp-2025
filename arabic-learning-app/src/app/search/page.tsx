"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import RecipeCard from "../../components/RecipeCard";
import Link from "next/link";
import type { Recipe } from "../../components/RecipeSearch";
// import GenerateImage from "../../components/GenerateImage";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = searchParams.get("q");
    if (!query) {
      setError("No search query provided");
      setIsLoading(false);
      return;
    }

    const searchRecipe = async () => {
      try {
        const requestBody = {
          model: "llama3",
          prompt: `You MUST return ONLY a valid JSON object for a Middle Eastern ${query} recipe, with NO other text. The recipe field MUST contain detailed, step-by-step cooking instructions, with each step on a new line. Follow this EXACT format:\n\n{\n  "title": "Recipe name in English",\n  "arabicTitle": "Recipe name in Arabic",\n  "transliteration": "Arabic transliteration",\n  "description": "Brief description of the dish",\n  "question": {\n    "arabic": "How to make this dish in Arabic?",\n    "transliteration": "Transliteration of the question",\n    "english": "How to make this dish?"\n  },\n  "ingredients": [\n    {\n      "name": "Ingredient name in English",\n      "arabicName": "Ingredient name in Arabic",\n      "transliteration": "Arabic transliteration",\n      "image": "/ingredient-image.jpg",\n      "description": "Brief description of the ingredient"\n    }\n  ],\n  "recipe": "1. Heat olive oil in a large skillet over medium heat.\n2. Add diced onions and cook until translucent.\n3. Add minced garlic and cook for another minute.\n4. Pour in the crushed tomatoes and simmer for 10 minutes.\n5. Create wells in the sauce and crack eggs into them.\n6. Cover and cook until eggs are set to your liking.\n7. Garnish with fresh herbs and serve hot."\n}\n\nIMPORTANT: The recipe field MUST contain numbered steps, each on a new line, with clear and detailed instructions.`,
          stream: false
        };

        const response = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.response) {
          throw new Error("No response data received from Ollama");
        }

        const jsonStr = data.response.trim();
        if (!jsonStr.startsWith("{") || !jsonStr.endsWith("}")) {
          throw new Error("Response is not a valid JSON object");
        }

        const recipeData = JSON.parse(jsonStr) as Recipe;
        console.log('Raw recipe data:', recipeData);

        // Validate required fields
        const requiredFields = ["title", "arabicTitle", "transliteration", "description", "question", "ingredients", "recipe"];
        const missingFields = requiredFields.filter(field => !recipeData[field as keyof Recipe]);

        if (missingFields.length > 0) {
          console.error('Missing fields:', missingFields);
          throw new Error(`Recipe is missing required fields: ${missingFields.join(", ")}`);
        }

        // Ensure recipe instructions are properly formatted
        if (typeof recipeData.recipe === 'string') {
          // Clean up the recipe text
          const recipeText = recipeData.recipe.trim();

          // Check if recipe is empty
          if (!recipeText) {
            throw new Error('Recipe instructions cannot be empty');
          }

          // Split recipe into steps
          let steps: string[] = [];
          
          if (recipeText.includes('\n')) {
            // Split by newlines if they exist
            steps = recipeText.split('\n');
          } else if (recipeText.includes('.')) {
            // Split by periods if no newlines
            steps = recipeText.split('.')
          } else {
            throw new Error('Recipe instructions must be separated by newlines or periods');
          }

          // Clean and format steps
          steps = steps
            .map(step => step.trim())
            .filter(step => step.length > 0)
            .map((step, index) => {
              // Remove any existing numbers
              const cleanStep = step.replace(/^\d+\.?\s*/, '').trim();
              // Add period if missing
              const stepWithPeriod = cleanStep.endsWith('.') ? cleanStep : `${cleanStep}.`;
              // Add number
              return `${index + 1}. ${stepWithPeriod}`;
            });

          if (steps.length === 0) {
            throw new Error('No valid recipe steps found');
          }

          // Join steps with newlines
          recipeData.recipe = steps.join('\n');
          console.log('Formatted recipe:', recipeData.recipe);
        } else {
          console.error('Recipe is not a string:', recipeData.recipe);
          throw new Error('Recipe instructions must be a string');
        }

        console.log('Processed recipe data:', recipeData);
        setRecipe({
          ...recipeData,
          image: recipeData.image || "/placeholder-recipe.jpg",
          recipe: recipeData.recipe || "",
        });
        setError("");
      } catch (error: any) {
        console.error("Error searching recipe:", error);
        setError(error.message || "Failed to generate recipe");
      } finally {
        setIsLoading(false);
      }
    };

    searchRecipe();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Search Results</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Generating recipe...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-600">{error}</p>
            <Link
              href="/"
              className="text-green-600 hover:underline mt-2 inline-block"
            >
              Try another search
            </Link>
          </div>
        )}

        {recipe && (
          <div className="max-w-2xl mx-auto">
          <RecipeCard {...recipe} image={recipe.image || undefined} />
          </div>
        )}
      </div>
    </div>
  );
}
