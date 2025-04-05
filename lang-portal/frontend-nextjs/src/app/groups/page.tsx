// app/groups/page.js
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Navigation from "@/components/Navigation";

interface Group {
  id: string;
  name: string;
  description?: string;
  wordCount?: number;
}

type Word = {
  id: string;
  english: string;
  arabic: string;
  romanized: string;
};

const fetchGroups = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/groups");
  if (!response.ok) throw new Error("Failed to fetch word groups");
  return response.json();
};

const fetchGroupWords = async (id: string): Promise<Word[]> => {
  const response = await fetch(`http://127.0.0.1:5000/api/groups/${id}/words`);
  if (!response.ok) throw new Error("Failed to fetch group words");
  return response.json();
};

export default function GroupsPage() {
  const {
    data: groups,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  const [groupsWithCounts, setGroupsWithCounts] = useState<Group[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch word counts for each group once groups are loaded
  useEffect(() => {
    if (groups && groups.length > 0) {
      const fetchAllWordCounts = async () => {
        const updatedGroups = await Promise.all(
          groups.map(async (group: Group) => {
            try {
              const words = await fetchGroupWords(group.id);
              return {
                ...group,
                wordCount: words.length,
              };
            } catch (error) {
              console.error(
                `Error fetching words for group ${group.id}:`,
                error
              );
              return group; // Return original group if fetching words fails
            }
          })
        );
        setGroupsWithCounts(updatedGroups);
      };

      fetchAllWordCounts();
    }
  }, [groups]);

  // Navigation props
  const navigationProps = {
    wordCount: groupsWithCounts.reduce(
      (total, group) => total + (group.wordCount || 0),
      0
    ),
    groupCount: groupsWithCounts.length || 0,
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems =
    groupsWithCounts.slice(indexOfFirstItem, indexOfLastItem) || [];

  const totalPages =
    groupsWithCounts.length > 0
      ? Math.ceil(groupsWithCounts.length / itemsPerPage)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Arabic Word Groups</h1>
              <p className="mt-2 text-blue-100">
                Browse and learn Arabic words by categories
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-xl font-semibold">
                {!isLoading && !error && groupsWithCounts.length > 0
                  ? `${groupsWithCounts.length} Groups Available`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation with same styling as main page */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation {...navigationProps} />
        </div>

        {/* Loading state handling */}
        {(isLoading ||
          (groups && groups.length > 0 && groupsWithCounts.length === 0)) && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg font-medium text-gray-600">
              Loading word groups...
            </div>
          </div>
        )}

        {/* Error state handling */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load word groups. Please check your connection and try
            again.
          </div>
        )}

        {/* Groups grid */}
        {!isLoading && !error && groupsWithCounts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentItems.map((group: Group) => (
                <Link
                  href={`/groups/${group.id}`}
                  key={group.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow transform hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {group.name}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {group.description || "Browse words in this category"}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-600 font-medium">
                        {group.wordCount || 0} words
                      </span>
                      <span className="inline-flex items-center text-indigo-600">
                        View Group
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
                          ></path>
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="bg-white px-6 py-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, groupsWithCounts.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{groupsWithCounts.length}</span>{" "}
                  groups
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
          </>
        )}
      </div>
    </div>
  );
}
