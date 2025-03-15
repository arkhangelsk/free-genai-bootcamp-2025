export interface Ingredient {
  name: string;
  arabicName: string;
  transliteration: string;
  image: string;
  description?: string;
}

export interface Recipe {
  searchedAt?: string;
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
