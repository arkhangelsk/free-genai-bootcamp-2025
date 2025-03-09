"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Ingredient {
  name: string;
  arabicName: string;
  transliteration: string;
  image: string;
  description?: string;
}

export interface Question {
  arabic: string;
  transliteration: string;
  english: string;
}

export interface RecipeStep {
  english: string;
  arabic: string;
  transliteration: string;
}

export interface Recipe {
  searchedAt?: string;
  title: string;
  arabicTitle: string;
  transliteration: string;
  description: string;
  question: Question;
  ingredients: Ingredient[];
  recipe: string;
  image?: string;
  steps?: RecipeStep[];
}

interface RecipeSearchProps {
  className?: string;
}

export default function RecipeSearch({ className }: RecipeSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const searchRecipe = async () => {
    console.log('searchRecipe called with query:', searchQuery);
    if (!searchQuery.trim()) {
      setError('Please enter a recipe name');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Navigate to search results page
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery)}`;
      console.log('Navigating to:', searchUrl);
      window.location.href = searchUrl;
      console.log('Navigation initiated');
      setSearchQuery('');
    } catch (error: any) {
      console.error('Navigation error:', error);
      setError('Failed to navigate to search results');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          console.log('Form submitted');
          searchRecipe();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setError('');
          }}
          placeholder="Enter a recipe name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-green-900 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:bg-gray-400"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
}
