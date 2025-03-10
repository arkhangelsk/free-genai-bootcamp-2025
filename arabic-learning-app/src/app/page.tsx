"use client";
import Image from "next/image";
import RecipeCard from "../components/RecipeCard";
import { useState, useEffect } from "react";

interface Ingredient {
  name: string;
  arabicName: string;
  transliteration: string;
  image: string;
  description?: string;
}

interface Recipe {
  searchedAt?: string; // ISO string timestamp
  title: string;
  arabicTitle: string;
  transliteration: string;
  description: string;
  question: {
    arabic: string;
    transliteration: string;
    english: string;
  };
  ingredients: Ingredient[];
  recipeEnglish?: string[] | string;
  recipeArabic?: string[] | string;
  image?: string;
}

const STORAGE_KEY = "savedRecipes";
const MAX_SAVED_RECIPES = 20; // Maximum number of recipes to keep in history

export default function Home() {
  const [searchedRecipes, setSearchedRecipes] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      title: "Hummus",
      arabicTitle: "حمص",
      transliteration: "ḥummuṣ",
      description:
        "A creamy dip made from blended chickpeas, tahini, lemon juice, and garlic.",
      question: {
        arabic: "هل تحب الحمص؟",
        transliteration: "hal tuḥibb al-ḥummuṣ?",
        english: "Do you like hummus?",
      },
      ingredients: [
        {
          name: "Chickpeas",
          arabicName: "حمص",
          transliteration: "ḥummuṣ",
          image: "/chickpeas.jpg",
          description:
            "The main ingredient in hummus, these legumes are rich in protein and fiber.",
        },
        {
          name: "Tahini",
          arabicName: "طحينة",
          transliteration: "ṭaḥīna",
          image: "/tahini.jpg",
          description:
            "A paste made from ground sesame seeds, adding richness and nutty flavor.",
        },
        {
          name: "Lemon",
          arabicName: "ليمون",
          transliteration: "laymūn",
          image: "/lemon.jpg",
          description: "Adds brightness and balances the flavors.",
        },
        {
          name: "Garlic",
          arabicName: "ثوم",
          transliteration: "thūm",
          image: "/garlic.jpg",
          description: "Provides a pungent kick and depth of flavor.",
        },
      ],
    },
    {
      title: "Falafel",
      arabicTitle: "فلافل",
      transliteration: "falāfil",
      description:
        "Deep-fried patties made from ground chickpeas, herbs, and spices.",
      question: {
        arabic: "كيف تحب الفلافل؟",
        transliteration: "kayf tuḥib al-falāfil?",
        english: "How do you like your falafel?",
      },
      ingredients: [
        {
          name: "Chickpeas",
          arabicName: "حمص",
          transliteration: "ḥummuṣ",
          image: "/chickpeas.jpg",
          description: "Soaked and ground to form the base of falafel.",
        },
        {
          name: "Parsley",
          arabicName: "بقدونس",
          transliteration: "baqdounis",
          image: "/parsley.jpg",
          description: "Fresh herb that adds color and fresh flavor.",
        },
        {
          name: "Coriander",
          arabicName: "كزبرة",
          transliteration: "kuzbara",
          image: "/coriander.jpg",
          description: "Both leaves and seeds are used for authentic flavor.",
        },
        {
          name: "Cumin",
          arabicName: "كمون",
          transliteration: "kammūn",
          image: "/cumin.jpg",
          description: "Adds warmth and earthiness to the spice blend.",
        },
      ],
    },
    {
      title: "Shawarma",
      arabicTitle: "شاورما",
      transliteration: "shāwarmā",
      description:
        "Marinated meat cooked on a rotating spit, served with bread and vegetables.",
      question: {
        arabic: "ما نوع الشاورما المفضل لديك؟",
        transliteration: "mā naw' al-shāwarmā al-mufaḍḍal ladayk?",
        english: "What's your favorite type of shawarma?",
      },
      ingredients: [
        {
          name: "Chicken/Meat",
          arabicName: "دجاج/لحم",
          transliteration: "dajāj/laḥm",
          image: "/meat.jpg",
          description:
            "Marinated in Middle Eastern spices and slow-cooked on a vertical rotisserie.",
        },
        {
          name: "Garlic Sauce",
          arabicName: "ثومية",
          transliteration: "thūmiyya",
          image: "/garlic-sauce.jpg",
          description:
            "A creamy emulsion of garlic, oil, and lemon juice, also known as toum.",
        },
        {
          name: "Pita Bread",
          arabicName: "خبز",
          transliteration: "khubz",
          image: "/pita.jpg",
        },
        {
          name: "Pickles",
          arabicName: "مخلل",
          transliteration: "mukhallal",
          image: "/pickles.jpg",
          description: "Adds crunch and tangy flavor to balance the rich meat.",
        },
      ],
    },
  ]);

  // Function to sanitize JSON string by removing control characters and ensuring valid JSON
 const sanitizeJsonString = (jsonStr: string): string => {
   try {
     // First attempt: Basic sanitization
     let sanitized = jsonStr
       .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
       .replace(/\n/g, "\\n") // Properly escape newlines
       .replace(/\r/g, "\\r") // Properly escape carriage returns
       .replace(/\t/g, "\\t") // Properly escape tabs
       .replace(/\\(?!["\\/bfnrt])/g, "\\\\"); // Escape backslashes not followed by valid escape chars

     // Fix trailing commas in arrays
     sanitized = sanitized.replace(/,\s*]/g, "]");

     // Fix trailing commas in objects
     sanitized = sanitized.replace(/,\s*}/g, "}");

     // Fix missing commas between array elements (addresses the specific error)
     sanitized = sanitized.replace(/][ \t\r\n]*\[/g, "],[");

     // Fix missing commas between string elements
     sanitized = sanitized.replace(/"[ \t\r\n]*"/g, '","');

     // Check if the JSON is valid after sanitization
     JSON.parse(sanitized);
     return sanitized;
   } catch (parseError) {
     console.warn(
       "Basic sanitization failed, attempting more aggressive repair:",
       parseError
     );

     // Second attempt: More aggressive cleaning and repair
     try {
       // Extract what looks like a JSON object
       const jsonMatch = jsonStr.match(/({[\s\S]*})/);
       if (jsonMatch) {
         jsonStr = jsonMatch[0];
       }

       // Ensure the string starts and ends with valid JSON brackets
       if (!jsonStr.trim().startsWith("{")) jsonStr = "{" + jsonStr;
       if (!jsonStr.trim().endsWith("}")) jsonStr = jsonStr + "}";

       // Replace unescaped quotes in strings
       let inString = false;
       let result = "";

       for (let i = 0; i < jsonStr.length; i++) {
         const char = jsonStr[i];

         if (char === '"' && (i === 0 || jsonStr[i - 1] !== "\\")) {
           inString = !inString;
         }

         // Handle array syntax problems
         if (inString && char === "]") {
           result += "\\]"; // Escape closing brackets inside strings
         } else if (inString && char === "[") {
           result += "\\["; // Escape opening brackets inside strings
         } else {
           result += char;
         }
       }

       // Check if we closed all strings properly
       let fixedJson = result;
       if (inString) {
         fixedJson += '"'; // Close any unclosed string
       }

       // Final fixes for common issues
       fixedJson = fixedJson
         // Fix double commas
         .replace(/,,/g, ",")
         // Fix space between property name and colon
         .replace(/"([^"]+)"[ \t]+:/g, '"$1":')
         // Fix missing quotes around property names
         .replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3');

       // Validate the final result
       JSON.parse(fixedJson);
       return fixedJson;
     } catch (finalError) {
       // If all repair attempts fail, throw an error with details
       console.error("All JSON repair attempts failed:", finalError);
       throw new Error("Failed to repair malformed JSON");
     }
   }
 };

  return (
    <div className="min-h-screen bg-gray-100 text-green-900">
      {/* Hero Section */}
      <header className="text-center py-16 bg-yellow-50">
        <h1 className="text-4xl font-bold">
          Middle Eastern Recipes - Learn & Cook
        </h1>
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
                    const requestBody = {
                      model: "llama3",
                      prompt: `Generate a valid JSON object for a Middle Eastern ${query} recipe. The JSON must strictly follow this structure:
                      {
                      "title": "Recipe name in English",
                      "arabicTitle": "Recipe name in Arabic",
                      "transliteration": "Arabic transliteration of the title",
                      "description": "Brief description of the dish",
                      "question": {
                        "arabic": "How to make this dish? (in Arabic)",
                        "transliteration": "Transliteration of the question",
                        "english": "How to make this dish?"
                      },
                      "ingredients": [
                        {
                          "name": "Ingredient name in English",
                          "arabicName": "Ingredient name in Arabic",
                          "transliteration": "Arabic transliteration of the ingredient name",
                          "image": "/ingredient-image.jpg",
                          "description": "Brief description of the ingredient"
                        }
                      ],
                      "recipeEnglish": "Step-by-step instructions in English.",
                      "recipeArabic": "Step-by-step instructions in Arabic"
                    }
                    Requirements:
                    * Each recipe step must be in a list format, ensuring they appear on separate lines.
                    * Ensure all Arabic text is properly written.
                    * Include accurate transliterations.
                    * Provide clear and structured ingredient details.
                    * Return the response ONLY as a JSON object with no additional text, explanations, or formatting.
                      `,
                      stream: false,
                    };

                    const response = await fetch(
                      "http://localhost:11434/api/generate",
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                      }
                    );

                    console.log("Response:--------", response);

                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    if (!data.response) {
                      throw new Error(
                        "No recipe data received. Please try again."
                      );
                    }

                    let jsonStr = data.response.trim();
                    console.log("Raw JSON string:", jsonStr);

                    // Extract JSON if it's wrapped in backticks or other text
                    const jsonMatch = jsonStr.match(/({[\s\S]*})/);
                    if (jsonMatch) {
                      jsonStr = jsonMatch[0];
                    }

                    if (!jsonStr.startsWith("{") || !jsonStr.endsWith("}")) {
                      throw new Error(
                        "Invalid recipe data received. Please try again."
                      );
                    }

                    // Sanitize the JSON string
                    const sanitizedJson = sanitizeJsonString(jsonStr);

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
                  const requestBody = {
                    model: "llama3",
                    prompt: `Generate a valid JSON object for a Middle Eastern ${query} recipe. The JSON must strictly follow this structure:
                      {
                      "title": "Recipe name in English",
                      "arabicTitle": "Recipe name in Arabic",
                      "transliteration": "Arabic transliteration of the title",
                      "description": "Brief description of the dish",
                      "question": {
                        "arabic": "How to make this dish? (in Arabic)",
                        "transliteration": "Transliteration of the question",
                        "english": "How to make this dish?"
                      },
                      "ingredients": [
                        {
                          "name": "Ingredient name in English",
                          "arabicName": "Ingredient name in Arabic",
                          "transliteration": "Arabic transliteration of the ingredient name",
                          "image": "/ingredient-image.jpg",
                          "description": "Brief description of the ingredient"
                        }
                      ],
                    "recipeEnglish": "Step-by-step instructions in English.",
                    "recipeArabic": "Step-by-step instructions in Arabic"
                    }
                    Requirements:
                    * Each recipe step must be in a list format, ensuring they appear on separate lines.
                    * Ensure all Arabic text is properly written.
                    * Include accurate transliterations.
                    * Provide clear and structured ingredient details.
                    * Return the response ONLY as a JSON object with no additional text, explanations, or formatting.
                      `,

                    stream: false,
                  };

                  const response = await fetch(
                    "http://localhost:11434/api/generate",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(requestBody),
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }

                  const data = await response.json();
                  if (!data.response) {
                    throw new Error(
                      "No recipe data received. Please try again."
                    );
                  }

                  let jsonStr = data.response.trim();

                  // Extract JSON if it's wrapped in backticks or other text
                  const jsonMatch = jsonStr.match(/({[\s\S]*})/);
                  if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                  }

                  if (!jsonStr.startsWith("{") || !jsonStr.endsWith("}")) {
                    throw new Error(
                      "Invalid recipe data received. Please try again."
                    );
                  }

                  // Sanitize the JSON string
                  const sanitizedJson = sanitizeJsonString(jsonStr);

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
          ].map((category) => (
            <div
              key={category}
              className="bg-white p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                {category}
              </h3>
              <button className="mt-4 bg-green-900 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors duration-300">
                Explore
              </button>
            </div>
          ))}
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
                <RecipeCard {...recipe} />
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

      {/* Featured Recipes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">
          Popular Recipes وصفات شعبية
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => (
            <RecipeCard key={index} {...recipe} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 bg-gray-800 text-white mt-12">
        <p>&copy; 2025 Middle Eastern Recipes. All rights reserved.</p>
      </footer>
    </div>
  );
}
