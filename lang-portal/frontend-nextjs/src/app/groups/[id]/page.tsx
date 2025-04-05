// app/groups/[id]/page.js
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";

type Word = {
  id: string;
  english: string;
  arabic: string;
  romanized: string;
};

type Group = {
  id: string;
  name: string;
  description: string;
  wordCount: number;
};

const fetchGroup = async (id: string): Promise<Group> => {
  const response = await fetch(`http://127.0.0.1:5000/api/groups/${id}`);
  if (!response.ok) throw new Error("Failed to fetch group details");
  return response.json();
};

const fetchGroupWords = async (id: string): Promise<Word[]> => {
  const response = await fetch(`http://127.0.0.1:5000/api/groups/${id}/words`);
  if (!response.ok) throw new Error("Failed to fetch group words");
  return response.json();
};

export default function GroupDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: group,
    error: groupError,
    isLoading: isGroupLoading,
  } = useQuery({
    queryKey: ["group", id],
    queryFn: () =>
      typeof id === "string"
        ? fetchGroup(id)
        : Promise.reject("ID is undefined"),
    enabled: !!id,
  });

  const {
    data: words,
    error: wordsError,
    isLoading: isWordsLoading,
  } = useQuery({
    queryKey: ["groupWords", id],
    queryFn: () =>
      typeof id === "string"
        ? fetchGroupWords(id)
        : Promise.reject("ID is undefined"),
    enabled: !!id,
  });

  // Navigation props
  const navigationProps = {
    wordCount: words ? words.length : 0,
  };

  const isLoading = isGroupLoading || isWordsLoading;
  const error = groupError || wordsError;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = words?.slice(indexOfFirstItem, indexOfLastItem) || [];

  const totalPages = words ? Math.ceil(words.length / itemsPerPage) : 0;
  const wordsCount = words ? words.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                {group ? group.name : "Group Details"}
              </h1>
              <p className="mt-2 text-blue-100">
                {group ? group.description : "Loading group..."}
              </p>
            </div>
            <div className="hidden md:block">
              <p className="text-xl font-semibold">
                {!isLoading && !error && words
                  ? `${words.length} Words in this Group`
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

        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/groups")}
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
            Back to Groups
          </button>
        </div>

        {/* Loading state handling */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg font-medium text-gray-600">
              Loading group words...
            </div>
          </div>
        )}

        {/* Error state handling */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load group details. Please check your connection and try
            again.
          </div>
        )}

        {/* Words table */}
        {!isLoading && !error && words && (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Arabic
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Romanized
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        English
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((word) => (
                      <tr
                        key={word.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900 font-medium">
                          <Link
                            href={`/words/${word.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {word.arabic}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {word.romanized}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {word.english}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, words?.length || 0)}
                    </span>{" "}
                    of <span className="font-medium">{words?.length || 0}</span>{" "}
                    words
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
