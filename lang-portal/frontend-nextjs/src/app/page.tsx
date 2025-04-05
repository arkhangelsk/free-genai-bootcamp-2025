// app/page.js
"use client";

import { useQuery } from "@tanstack/react-query";
import LastStudySession from "@/components/LastStudySession";
import StudyProgress from "@/components/StudyProgress";
import QuickStats from "@/components/QuickStats";
import RecentActivity from "@/components/RecentActivity";
import FlashcardApp from "@/components/FlashcardApp";
import Link from "next/link";
import Navigation from "@/components/Navigation";

const fetchWords = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/words");
  if (!response.ok) throw new Error("Failed to fetch words");
  return response.json();
};

export default function Home() {
  const {
    data: words,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["words"],
    queryFn: fetchWords,
  });

  // Example: pass data to the Navigation component (if needed)
  const navigationProps = {
    wordCount: words ? words.length : 0, // Example: pass word count
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Arabic Learning Dashboard</h1>
              <p className="mt-2 text-blue-100">
                Track your progress and continue learning
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-xl font-semibold">
                {!isLoading && !error && words
                  ? `${words.length} Words Available`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation with improved styling */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation {...navigationProps} />
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg font-medium text-gray-600">
              Loading dashboard data...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load words. Please check your connection and try again.
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Call to action */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="md:flex">
                <div className="p-6 md:w-2/3">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ready to continue learning?
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Pick up where you left off or start a new study session.
                    Your current progress is tracked and ready.
                  </p>
                  <div className="space-x-4">
                    <Link href="/study">
                      <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-sm transition font-medium">
                        Start Studying →
                      </button>
                    </Link>
                    <Link href="/words">
                      <button className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-6 py-3 rounded-lg shadow-sm transition font-medium">
                        Browse Words
                      </button>
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className="text-6xl font-bold text-indigo-600 mb-2"
                      dir="rtl"
                    >
                      تعلم
                    </div>
                    <div className="text-blue-700 font-medium">
                      ta'allam (learn)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard widgets */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Your Learning Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LastStudySession />
              <StudyProgress totalWords={words ? words.length : 0} />
              <QuickStats />
            </div>

            {/* Recent activity */}
            <div className="mt-8">
              <RecentActivity />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
