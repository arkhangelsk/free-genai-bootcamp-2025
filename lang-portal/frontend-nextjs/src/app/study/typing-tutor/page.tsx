"use client";

import Navigation from "@/components/Navigation";

export default function TypingTutorPage() {
  return (
    
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Arabic Typing Tutor</h1>
              <p className="mt-2 text-blue-100">
                Improve your Arabic typing skills with our interactive tutor
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation />
        </div>
      </div>
      {/* Typing Tutor */}
{/*       
      <Navigation activityCount={0} /> */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Arabic Typing Tutor</h1>
          <iframe 
            src="/keyboard.htm"
            className="w-full h-[800px] border-0"
            title="Arabic Keyboard"
          />
        </div>
      </div>
    </div>
  );
}
