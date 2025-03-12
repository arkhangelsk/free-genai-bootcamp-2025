"use client";
import React from "react";

export default function MainDishes() {
  return (
    <div className="min-h-screen bg-gray-100 text-green-900">
      {/* Hero Section */}
      <header className="text-center py-16 bg-yellow-50">
        <h1 className="text-4xl font-bold">Main Dishes</h1>
        <p className="mt-4 text-lg">
          Start your meal with these delicious bites.
        </p>
      </header>

      {/* Featured Main Dishes Recipes */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Main Dishes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Mansaf منسف",
            "Kabsa كبسة",
            "Mandi مندي",
            "Shawarma شاورما",
            "Kofta كفتة",
            "Maqluba مقلوبة",
            "Koshari كشري",
            "Musakhan مسخن",
            "Fesenjan فسنجون",
            "Bamia بامية",
            "Sayadieh صيادية",
            "Fatteh فتة",
          ].map((appetizer) => (
            <div
              key={appetizer}
              className="bg-white p-6 rounded-lg shadow-lg text-center"
            >
              <h3 className="text-xl font-semibold text-green-900 mb-4">
                {appetizer}
              </h3>
              <button className="mt-4 bg-green-900 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors duration-300">
                View Recipe
              </button>
            </div>
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