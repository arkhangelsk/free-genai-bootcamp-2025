// components/LastStudySession.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface StudySession {
  id: number;
  group_name: string;
  activity_name: string;
  activity_type: string;
  start_time: string;
  end_time: string | null;
}

const fetchLatestSession = async (): Promise<StudySession> => {
  const response = await fetch("http://127.0.0.1:5000/api/study-sessions/latest");
  if (!response.ok) {
    throw new Error("Failed to fetch latest study session");
  }
  return response.json();
};

export default function LastStudySession() {
  const {
    data: session,
    error,
    isLoading,
  } = useQuery<StudySession>({
    queryKey: ["latestStudySession"],
    queryFn: fetchLatestSession,
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Last Study Session
        </h2>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Last Study Session
        </h2>
        <p className="text-red-600">No study sessions yet!</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Last Study Session
        </h2>
        <p className="text-gray-600">No study sessions yet</p>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(session.start_time), {
    addSuffix: true,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <h2 className="text-lg font-bold text-gray-900 mb-3">
        Last Study Session
      </h2>
      <div className="flex items-center mb-3">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
          {session.activity_type === "quiz" ? "Q" : "P"}
        </div>
        <div>
          <p className="font-medium text-gray-900">{session.activity_name}</p>
          <p className="text-sm text-gray-500">{timeAgo}</p>
        </div>
      </div>
      <div className="bg-gray-50 p-3 rounded-md mb-3">
        <p className="text-sm font-medium text-gray-900">{session.group_name}</p>
        <p className="text-sm text-gray-500 capitalize">
          {session.activity_type} Activity
        </p>
      </div>
      <Link
        href={`/sessions/${session.id}`}
        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
      >
        View Session Details
        <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </Link>
    </div>
  );
}
