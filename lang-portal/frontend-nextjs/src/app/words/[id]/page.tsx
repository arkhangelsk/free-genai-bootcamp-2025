"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import Navigation from "@/components/Navigation";

interface Example {
  arabic: string;
  romanized: string;
  english: string;
}

interface WordDetails {
  arabic: string;
  romanized: string;
  english: string;
  example: string; // JSON string containing Example object
}

const fetchWordDetails = async (id: string): Promise<WordDetails> => {
  const response: Response = await fetch(
    `http://127.0.0.1:5000/api/words/${id}`
  );
  if (!response.ok) throw new Error("Failed to fetch word details");
  return response.json() as Promise<WordDetails>;
};

// Component to display the example with proper formatting and good contrast
const ExampleDisplay = ({ exampleStr }: { exampleStr: string }) => {
  const [isExampleSpeaking, setIsExampleSpeaking] = useState(false);

  try {
    // Parse the JSON string into an object
    const example = JSON.parse(exampleStr) as Example;

    // Function to handle example pronunciation
    const handlePronounce = () => {
      // Check if the browser supports speech synthesis
      if ("speechSynthesis" in window) {
        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        // Create an utterance instance
        const utterance = new SpeechSynthesisUtterance(example.arabic);

        // Set the language to Arabic
        utterance.lang = "ar-SA"; // Arabic (Saudi Arabia)

        // Handle events to manage the speaking state
        utterance.onstart = () => setIsExampleSpeaking(true);
        utterance.onend = () => setIsExampleSpeaking(false);
        utterance.onerror = () => {
          setIsExampleSpeaking(false);
          alert("Sorry, there was an error with speech synthesis.");
        };

        // Speak the example sentence
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback for browsers that don't support speech synthesis
        alert(
          "Sorry, your browser doesn't support text-to-speech functionality."
        );
      }

      // Fallback to reset speaking state after 10 seconds (for very long sentences)
      setTimeout(() => setIsExampleSpeaking(false), 10000);
    };

    return (
      <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-indigo-800">Example Usage</h3>
          <button
            onClick={handlePronounce}
            disabled={isExampleSpeaking}
            className={`px-3 py-1 rounded-md text-sm transition flex items-center ${
              isExampleSpeaking
                ? "bg-indigo-400 cursor-not-allowed text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isExampleSpeaking ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Speaking...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  ></path>
                </svg>
                Pronounce
              </>
            )}
          </button>
        </div>
        <div className="space-y-3">
          <p className="text-2xl font-medium text-gray-900" dir="rtl">
            {example.arabic}
          </p>
          <p className="italic text-gray-800">{example.romanized}</p>
          <p className="text-gray-800 font-medium">{example.english}</p>
        </div>
      </div>
    );
  } catch (error) {
    // Fallback in case the JSON parsing fails
    return (
      <div className="mt-6 p-6 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-gray-900">
          <strong>Example:</strong> {exampleStr}
        </p>
      </div>
    );
  }
};

export default function WordDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isWordSpeaking, setIsWordSpeaking] = useState(false);

  const {
    data: word,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["word", id],
    queryFn: () =>
      typeof id === "string"
        ? fetchWordDetails(id)
        : Promise.reject("ID is undefined"),
    enabled: !!id, // Ensure the query only runs if id is defined
  });

  // Navigation props - we might have limited data here since we're on a detail page
  const navigationProps = {
    wordCount: 0, // You might want to fetch this or pass it through state
  };

  // Function to pronounce the word
  const pronounceWord = () => {
    if (!word) return;

    // Check if the browser supports speech synthesis
    if ("speechSynthesis" in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      // Create an utterance instance
      const utterance = new SpeechSynthesisUtterance(word.arabic);

      // Set the language to Arabic
      utterance.lang = "ar-SA"; // Arabic (Saudi Arabia)

      // Handle events to manage the speaking state
      utterance.onstart = () => setIsWordSpeaking(true);
      utterance.onend = () => setIsWordSpeaking(false);
      utterance.onerror = () => {
        setIsWordSpeaking(false);
        alert("Sorry, there was an error with speech synthesis.");
      };

      // Speak the word
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback for browsers that don't support speech synthesis
      alert(
        "Sorry, your browser doesn't support text-to-speech functionality."
      );
    }

    // Fallback to reset speaking state after 3 seconds
    setTimeout(() => setIsWordSpeaking(false), 3000);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-lg font-medium text-gray-600">
          Loading word details...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-lg font-medium text-red-500">
          Failed to load word details
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section matching main page */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Word Details</h1>
              <p className="mt-2 text-blue-100">
                {word
                  ? `${word.english} (${word.romanized})`
                  : "Loading details..."}
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-xl font-semibold">
                {word && <span dir="rtl">{word.arabic}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation with matching styling */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation {...navigationProps} />
        </div>

        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Word List
          </button>
        </div>

        {word && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {word.arabic}
                </h1>
                <button
                  onClick={pronounceWord}
                  disabled={isWordSpeaking}
                  className={`px-3 py-1 rounded-md text-sm transition flex items-center ${
                    isWordSpeaking
                      ? "bg-indigo-400 cursor-not-allowed text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  {isWordSpeaking ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Speaking...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        ></path>
                      </svg>
                      Pronounce
                    </>
                  )}
                </button>
              </div>
              <p className="text-xl text-gray-800 mb-1">{word.romanized}</p>
              <p className="text-lg text-gray-800 font-medium">
                {word.english}
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">
                    Definition
                  </h2>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="w-24 font-medium text-gray-700">
                          Arabic:
                        </span>
                        <span className="text-xl text-gray-900 font-medium">
                          {word.arabic}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-24 font-medium text-gray-700">
                          Romanized:
                        </span>
                        <span className="text-gray-900">{word.romanized}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-24 font-medium text-gray-700">
                          English:
                        </span>
                        <span className="text-gray-900">{word.english}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:text-right hidden md:block">
                  <div
                    className="text-6xl font-bold text-indigo-600 mb-4"
                    dir="rtl"
                  >
                    {word.arabic}
                  </div>
                </div>
              </div>

              {word.example && <ExampleDisplay exampleStr={word.example} />}

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Practice
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-700 mb-4">
                    Try using this word in a sentence to improve your memory and
                    understanding.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={pronounceWord}
                      disabled={isWordSpeaking}
                      className={`px-4 py-2 rounded-md transition flex items-center ${
                        isWordSpeaking
                          ? "bg-indigo-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {isWordSpeaking ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Speaking...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                            ></path>
                          </svg>
                          Pronunciation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
