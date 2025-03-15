export const searchRecipe = async (query: string) => {
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
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

   if (!response.ok) {
     throw new Error(`HTTP error! status: ${response.status}`);
   }

   const data = await response.json();
   if (!data.response) {
     throw new Error("No recipe data received. Please try again.");
   }

   let jsonStr = data.response.trim();
   console.log("Raw JSON string:", jsonStr);

   // Extract JSON if it's wrapped in backticks or other text
   const jsonMatch = jsonStr.match(/({[\s\S]*})/);
   if (jsonMatch) {
     jsonStr = jsonMatch[0];
   }

   if (!jsonStr.startsWith("{") || !jsonStr.endsWith("}")) {
     throw new Error("Invalid recipe data received. Please try again.");
   }

  return jsonStr;
};




