"use client";

import Navigation from "@/components/Navigation";
import FlashcardApp from "@/components/FlashcardApp";

export default function TypingTutorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Arabic Flashcards</h1>
              <p className="mt-2 text-blue-100">
                Enhance your vocabulary with interactive flashcards
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation />
        </div>

        {/* <div className="bg-white rounded-lg shadow-md p-6"> */}
        {/* Flashcard App */}
        <div className="mt-8 mr-auto">
          <FlashcardApp />
        </div>

        {/* </div> */}
      </div>
    </div>
  );
}
