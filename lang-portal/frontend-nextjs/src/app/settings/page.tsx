"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  const handleResetHistory = async () => {
    if (window.confirm("Are you sure you want to reset your session history? This action cannot be undone.")) {
      setIsResetting(true);
      try {
        const response = await fetch("http://127.0.0.1:5000/api/study-sessions/reset", {
          method: "POST",
        });
        
        if (response.ok) {
          alert("Session history has been reset successfully!");
          router.refresh();
        } else {
          throw new Error("Failed to reset session history");
        }
      } catch (error) {
        alert("Failed to reset session history. Please try again.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="mt-2 text-indigo-100">
                Customize your learning experience
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

        {/* Settings Content */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Theme Selection */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold mb-4">Theme</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => handleThemeChange("light")}
                className={`px-4 py-2 rounded-lg ${
                  theme === "light"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Light
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`px-4 py-2 rounded-lg ${
                  theme === "dark"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Reset History */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Reset Data</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                Clear your session history and start fresh. This action cannot be undone.
              </p>
              <button
                onClick={handleResetHistory}
                disabled={isResetting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Reset Session History"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
