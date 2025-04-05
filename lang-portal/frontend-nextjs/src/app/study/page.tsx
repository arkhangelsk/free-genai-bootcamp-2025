// app/study/page.js
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Navigation from "@/components/Navigation";

interface StudyActivity {
  id: number;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  estimated_time: string;
  icon?: string;
}

const fetchStudyActivities = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/study-activities");
  if (!response.ok) throw new Error("Failed to fetch study activities");
  return response.json();
};

export default function StudyActivitiesPage() {
  const {
    data: activities,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["study-activities"],
    queryFn: fetchStudyActivities,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 9;

  // Filter and search logic
  const filteredActivities = activities
    ? activities.filter((activity: StudyActivity) => {
        const matchesFilter = filter === "all" || activity.type === filter;
        const matchesSearch =
          activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : [];

  // Get unique activity types for filter options
  const activityTypes = activities
    ? [
        "all",
        ...new Set(activities.map((activity: StudyActivity) => activity.type)),
      ]
    : ["all"];

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredActivities.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Navigation props
  const navigationProps = {
    activityCount: activities ? activities.length : 0,
  };

  // Function to get appropriate icon based on activity type
  const getActivityIcon = (type: string, icon?: string) => {
    if (icon) return icon;

    // Default icons based on type
    switch (type.toLowerCase()) {
      case "flashcards":
        return "📇";
      case "quiz":
        return "❓";
      case "matching":
        return "🔄";
      case "writing":
        return "✍️";
      case "listening":
        return "👂";
      case "speaking":
        return "🗣️";
      case "typing-tutor":
        return "⌨️";
      default:
        return "📚";
    }
  };

  // Function to get color scheme based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Study Activities</h1>
              <p className="mt-2 text-indigo-100">
                Choose from various activities to enhance your Arabic language
                skills
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-xl font-semibold">
                {!isLoading && !error && activities
                  ? `${activities.length} Activities Available`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation {...navigationProps} />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    filter === type
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg font-medium text-gray-600">
              Loading study activities...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load study activities. Please check your connection and
            try again.
          </div>
        )}

        {/* No results state */}
        {!isLoading && !error && filteredActivities.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-6">
            No activities match your current filters. Try changing your search
            criteria.
          </div>
        )}

        {/* Activities grid */}
        {!isLoading && !error && filteredActivities.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {currentItems.map((activity: StudyActivity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <span className="text-2xl mr-3">
                        {getActivityIcon(activity.type, activity.icon)}
                      </span>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {activity.name}
                      </h2>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between mt-4">
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                            activity.difficulty
                          )}`}
                        >
                          {activity.difficulty}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {activity.estimated_time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Link
                      href={
                        activity.type === "practice" &&
                        activity.name === "Typing Tutor"
                          ? "/study/typing-tutor"
                          : activity.type === "quiz" &&
                            activity.name === "Arabic Vocabulary Quiz"
                          ? "/quiz"
                          : activity.type === "practice" &&
                            activity.name === "Learn Vocabulary"
                          ? "/groups"
                          : activity.type === "flashcards" &&
                            activity.name === "Arabic Flashcards"
                          ? "/study/flash-cards"
                          : `/study/${activity.id}`
                      }
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full justify-center"
                      onClick={() => {
                        console.log("Full activity:", activity);
                        console.log("Activity type:", activity.type);
                        console.log(
                          "Activity type lowercase:",
                          activity.type.toLowerCase()
                        );
                        console.log(
                          "Is typing tutor?",
                          activity.type.toLowerCase() === "typing-tutor" ||
                            activity.type.toLowerCase() === "typing"
                        );
                      }}
                    >
                      Start Activity
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-6 py-4 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredActivities.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredActivities.length}
                    </span>{" "}
                    activities
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
