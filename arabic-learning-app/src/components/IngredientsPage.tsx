"use client";
import { Ingredient } from './RecipeSearch';
import { useState } from 'react';

const playAudio = (word: string, onStart?: () => void, onEnd?: () => void) => {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'ar-SA';
  utterance.rate = 0.8;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
};

interface AudioButtonProps {
  text: string;
  label: string;
}

const AudioButton = ({ text, label }: AudioButtonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async () => {
    if (isPlaying || isLoading) return;
    
    setIsLoading(true);
    try {
      // Check if speech synthesis is available
      if (!window.speechSynthesis) {
        throw new Error('Speech synthesis is not supported in your browser');
      }

      // Wait for voices to load if needed
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise<void>((resolve) => {
          speechSynthesis.onvoiceschanged = () => resolve();
        });
      }

      playAudio(
        text,
        () => {
          setIsLoading(false);
          setIsPlaying(true);
        },
        () => {
          setIsPlaying(false);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Audio playback error:', error);
      setError(error instanceof Error ? error.message : 'Failed to play audio');
      setIsLoading(false);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={handlePlay}
        className={`
          p-2 rounded-full transition-all flex items-center justify-center shadow-sm
          ${error 
            ? 'bg-red-500 hover:bg-red-600 cursor-not-allowed' 
            : isPlaying
              ? 'bg-green-600 scale-110 cursor-not-allowed'
              : isLoading
                ? 'bg-green-400 cursor-wait'
                : 'bg-green-900 hover:bg-amber-600 hover:scale-110 cursor-pointer'
          }
        `}
        title={error || `Listen to ${label}`}
        disabled={isPlaying || isLoading}
        aria-label={error || `Listen to ${label}`}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <span role="img" className="text-white text-lg">
            {isPlaying ? '🔊' : '🎧'}
          </span>
        )}
      </button>
      {error && (
        <div 
          role="alert"
          className="
            absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
            bg-red-100 text-red-600 text-xs px-2 py-1 rounded
            whitespace-nowrap shadow-sm border border-red-200
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
          "
        >
          {error}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-100 border-r border-b border-red-200 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

interface IngredientsPageProps {
  title: string;
  arabicTitle: string;
  ingredients: Ingredient[];
  recipeEnglish?: string[] | string;
  recipeArabic?: string[] | string;
  onClose: () => void;
}

export default function IngredientsPage({ title, arabicTitle, ingredients, onClose }: IngredientsPageProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative p-6 animate-slideUp">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="mb-8 pr-8">
          <h3 className="text-2xl font-bold mb-1">{title}</h3>
          <p className="text-lg text-green-600">{arabicTitle}</p>
        </div>
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h4 className="text-xl font-semibold">Ingredients</h4>
              <div className="flex-1 border-b border-gray-200"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {ingredients.map((ingredient, index) => (
            <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
              <div className="aspect-w-1 aspect-h-1 mb-4 relative rounded-lg overflow-hidden">
                {/* <img
                  src={ingredient.image}
                  alt={ingredient.name}
                  className="object-cover w-full h-48 transition-transform hover:scale-105 duration-300"
                /> */}
              </div>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-lg text-gray-800">{ingredient.name}</h4>
                  <AudioButton 
                    text={ingredient.arabicName}
                    label={`${ingredient.name} in Arabic`}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-green-600 font-medium">{ingredient.arabicName}</p>
                  <p className="text-sm text-gray-500 italic">{ingredient.transliteration}</p>
                </div>
                {ingredient.description && (
                  <p className="text-sm text-gray-600 leading-relaxed border-t pt-2 mt-2">{ingredient.description}</p>
                )}
              </div>
            </div>
          ))}
            </div>
          </section>
          
          
        </div>
      </div>
    </div>
  );
}
