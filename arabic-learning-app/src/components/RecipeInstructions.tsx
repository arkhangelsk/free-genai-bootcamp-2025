import React, { useState, useEffect } from "react";

interface RecipeInstructionsProps {
  recipeEnglish: string;
  recipeArabic: string;
  onClose: () => void;
}

const RecipeInstructions: React.FC<RecipeInstructionsProps> = ({
  recipeEnglish,
  recipeArabic,
  onClose,
}) => {
  // State to store the split Arabic instructions
  const [arabicInstructions, setArabicInstructions] = useState<string[]>([]);
  // State to track which instruction is currently being spoken
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Initialize speech synthesis
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  // Split the Arabic instructions into separate lines on component mount
 useEffect(() => {
   if (recipeArabic) {
     // Check if recipeArabic is already an array
     if (Array.isArray(recipeArabic)) {
       setArabicInstructions(recipeArabic);
     } else {
       // Split by newline characters if it's a string
       const lines = recipeArabic
         .split("\n")
         .filter((line) => line.trim() !== "");
       setArabicInstructions(lines);
     }
   }
 }, [recipeArabic]);

  // Function to speak a specific instruction
  const speakInstruction = (text: string, index: number) => {
    if (!synth) return;

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language to Arabic
    utterance.lang = "ar-SA";

    // Set the speaking index to highlight the current line
    setSpeakingIndex(index);

    // Add an event listener for when speech ends
    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    // Speak the text
    synth.speak(utterance);
  };

  // Cancel any ongoing speech when component unmounts
  useEffect(() => {
    return () => {
      if (synth) {
        synth.cancel();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden">
        <div className="flex justify-between items-center p-5 bg-gray-100 border-b">
          <h4 className="text-xl font-semibold text-gray-900">
            Recipe Instructions
          </h4>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-6">
            <h5 className="text-lg font-bold text-gray-800">
              English Instructions:
            </h5>
            <div className="text-gray-700 mt-2 leading-relaxed">
              {Array.isArray(recipeEnglish)
                ? recipeEnglish.map((step, index) => (
                    <p key={index} className="mt-2">
                      Step {index + 1}: {step.trim()}
                    </p>
                  ))
                : (recipeEnglish || "").split(".").map((step, index) =>
                    step.trim() ? (
                      <p key={index} className="mt-2">
                        Step {index + 1}: {step.trim()}.
                      </p>
                    ) : null
                  )}
            </div>
          </div>
          <div
            dir="rtl"
            className="bidi-override text-gray-700 mt-4 leading-relaxed text-right"
          >
            <h5 className="text-lg font-bold text-gray-800">تعليمات الوصفة:</h5>

            {arabicInstructions.map((instruction, index) => (
              <div
                key={index}
                className={`flex justify-between items-center mt-2 p-2 rounded ${
                  speakingIndex === index ? "bg-green-100" : ""
                }`}
              >
                <button
                  onClick={() => speakInstruction(instruction, index)}
                  className="ml-2 p-2 text-green-900 hover:text-amber-400 flex-shrink-0"
                  title="Play audio"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <p className="whitespace-pre-line flex-grow">{instruction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeInstructions;
