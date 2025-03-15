"use client";

import { useState } from "react";
import IngredientsPage from "./IngredientsPage";
import RecipeInstructions from "./RecipeInstructions";
import Image from "next/image";
import GenerateImage from "./GenerateImage";

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

const useAudioPlayback = () => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  });

  const playAudio = async (word: string) => {
    if (state.isPlaying || state.isLoading) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!window.speechSynthesis) {
        throw new Error("Speech synthesis is not supported in your browser");
      }

      // Wait for voices to load if needed
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((resolve) => {
          speechSynthesis.onvoiceschanged = () => resolve();
        });
      }

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "ar-SA";
      utterance.rate = 0.8;

      utterance.onstart = () => {
        setState((prev) => ({ ...prev, isLoading: false, isPlaying: true }));
      };

      utterance.onend = () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      };

      utterance.onerror = () => {
        setState((prev) => ({
          ...prev,
          isPlaying: false,
          isLoading: false,
          error: "Failed to play audio",
        }));
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to play audio",
      }));

      // Clear error after 3 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, error: null }));
      }, 3000);
    }
  };

  return { playAudio, ...state };
};

interface RecipeCardProps {
  title: string;
  arabicTitle: string;
  transliteration: string;
  description: string;
  question: {
    arabic: string;
    transliteration: string;
    english: string;
  };
  ingredients: Array<{
    name: string;
    arabicName: string;
    transliteration: string;
    image: string;
    description?: string;
  }>;
  recipeEnglish?: string[] | string;
  recipeArabic?: string[] | string;
  image?: string;
}

export default function RecipeCard({
  title,
  arabicTitle,
  transliteration,
  description,
  question,
  ingredients,
  recipeEnglish,
  recipeArabic,
}: RecipeCardProps) {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const titleAudio = useAudioPlayback();
  const questionAudio = useAudioPlayback();
  const [imageExists, setImageExists] = useState(false);

  // Callback to update imageExists after generating an image
  const handleImageGenerated = () => {
    setImageExists(true);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow relative">
      <div className="w-full flex justify-center">
        {imageExists ? (
          // Display existing image if it exists
          <Image
            src={`/images/${title.toLowerCase().replace(/\s/g, "-")}.png`}
            width={300} // Set appropriate width
            height={200} // Set appropriate height
            alt={title}
            className="rounded-md object-cover"
            priority
            unoptimized={true}
          />
        ) : (
          // Generate new image if no image exists
          <div className="rounded-md object-cover">
            <GenerateImage
              title={title}
              onImageGenerated={handleImageGenerated}
            />
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold mt-4">{title}</h3>
      <p className="text-lg text-green-600">{arabicTitle}</p>
      <p className="italic text-gray-600">{transliteration}</p>
      <p className="mt-2 text-gray-700">{description}</p>
      <div className="mt-4 bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xl text-green-700">{question.arabic}</p>
            <p className="italic text-gray-600">{question.transliteration}</p>
            <p className="text-sm text-gray-700">{question.english}</p>
          </div>
          <div className="relative">
            <button
              className={`
                p-2 rounded-full transition-all flex items-center justify-center
                ${
                  questionAudio.error
                    ? "bg-red-500 hover:bg-red-600"
                    : questionAudio.isPlaying
                    ? "bg-green-600 scale-110"
                    : questionAudio.isLoading
                    ? "bg-green-400"
                    : "bg-zinc-600 hover:bg-zinc-800 hover:scale-110"
                }
              `}
              onClick={() => questionAudio.playAudio(question.arabic)}
              title={questionAudio.error || "Listen to Arabic question"}
              disabled={questionAudio.isPlaying || questionAudio.isLoading}
            >
              {questionAudio.isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
              ) : (
                <span
                  role="img"
                  aria-label="Listen"
                  className="text-white text-lg"
                >
                  {questionAudio.isPlaying ? "🔊" : "🎧"}
                </span>
              )}
            </button>
            {questionAudio.error && (
              <div className="absolute bottom-full right-0 mb-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded whitespace-nowrap shadow-sm border border-red-200">
                {questionAudio.error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          className="flex-1 bg-green-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all hover:shadow-md"
          onClick={() => setShowIngredients(true)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Ingredients
        </button>

        {/* Add a Recipe button that toggles showing the recipe steps */}
        {recipeEnglish && recipeArabic && (
          <button
            className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-amber-700 transition-all hover:shadow-md"
            onClick={() => setShowRecipe(!showRecipe)}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {showRecipe ? "Hide Steps" : "Recipe"}
          </button>
        )}

        <div className="relative">
          <button
            className={`
              flex items-center justify-center p-2 rounded-lg transition-all
              ${
                titleAudio.error
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : titleAudio.isPlaying
                  ? "bg-green-200 text-green-700"
                  : titleAudio.isLoading
                  ? "bg-green-50 text-green-500"
                  : "bg-green-100 text-green-600 hover:bg-green-200 hover:shadow-md"
              }
            `}
            onClick={() => titleAudio.playAudio(arabicTitle)}
            title={titleAudio.error || "Listen to Arabic pronunciation"}
            aria-label={titleAudio.error || "Listen to Arabic pronunciation"}
            disabled={titleAudio.isPlaying || titleAudio.isLoading}
          >
            {titleAudio.isLoading ? (
              <svg
                className="animate-spin h-5 w-5"
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
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.343 9.657a4 4 0 105.657 5.657l2.829-2.829a4 4 0 00-5.657-5.657L6.343 9.657z"
                />
              </svg>
            )}
          </button>
          {titleAudio.error && (
            <div className="absolute bottom-full right-0 mb-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded whitespace-nowrap shadow-sm border border-red-200">
              {titleAudio.error}
            </div>
          )}
        </div>
      </div>
      {showIngredients && (
        <IngredientsPage
          title={title}
          arabicTitle={arabicTitle}
          ingredients={ingredients}
          recipeEnglish={recipeEnglish}
          recipeArabic={recipeArabic}
          onClose={() => setShowIngredients(false)}
        />
      )}
      {showRecipe && recipeEnglish && recipeArabic && (
        <RecipeInstructions
          recipeEnglish={recipeEnglish}
          recipeArabic={recipeArabic}
          onClose={() => setShowRecipe(false)}
        />
      )}
    </div>
  );
}
