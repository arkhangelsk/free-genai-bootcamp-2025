// app/words/page.js
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Navigation from "@/components/Navigation";

type Word = {
  id: string;
  english: string;
  arabic: string;
  romanized: string;
};

const fetchWords = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/words");
  if (!response.ok) throw new Error("Failed to fetch words");
  return response.json();
};

export default function WordsPage() {
  const {
    data: words,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["words"],
    queryFn: fetchWords,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Navigation props similar to Home page
  const navigationProps = {
    wordCount: words ? words.length : 0,
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = words?.slice(indexOfFirstItem, indexOfLastItem) || [];

  const totalPages = words ? Math.ceil(words.length / itemsPerPage) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section matching main page */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Arabic Vocabulary</h1>
              <p className="mt-2 text-blue-100">
                Browse and learn Arabic words
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
        {/* Navigation with same styling as main page */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation {...navigationProps} />
        </div>

        {/* Loading state handling */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg font-medium text-gray-600">
              Loading words...
            </div>
          </div>
        )}

        {/* Error state handling */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load words. Please check your connection and try again.
          </div>
        )}

        {/* Words table */}
        {!isLoading && !error && (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider">
                        Arabic
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider">
                        Romanized
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider">
                        English
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((word: Word) => (
                      <tr
                        key={word.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-900 font-medium">
                          <Link
                            href={`/words/${word.id}`}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline"
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
