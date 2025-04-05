"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

interface StudySession {
  id: number;
  group_name: string;
  activity_name: string;
  activity_type: string;
  activity_difficulty: string;
  start_time: string;
  end_time: string | null;
  total_questions?: number;
  correct_answers?: number;
}

const fetchSessionDetails = async (id: string): Promise<StudySession> => {
  const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch session details");
  }
  return response.json();
};

export default function SessionDetails() {
  const params = useParams();
  const sessionId = params.id as string;

  const {
    data: session,
    error,
    isLoading,
  } = useQuery<StudySession>({
    queryKey: ["sessionDetails", sessionId],
    queryFn: () => fetchSessionDetails(sessionId),
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          Failed to load session details. Please try again later.
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          Session not found
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(session.start_time), {
    addSuffix: true,
  });
  const startDate = format(new Date(session.start_time), "PPpp");
  const endDate = session.end_time
    ? format(new Date(session.end_time), "PPpp")
    : "In Progress";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Study Session Details</h1>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1 rotate-180"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Activity Details
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Activity</dt>
                  <dd className="text-base text-gray-900">
                    {session.activity_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="text-base text-gray-900 capitalize">
                    {session.activity_type}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Group</dt>
                  <dd className="text-base text-gray-900">{session.group_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
                  <dd className="text-base text-gray-900 capitalize">
                    {session.activity_difficulty || "Not specified"}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Session Timing
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Started</dt>
                  <dd className="text-base text-gray-900">{startDate}</dd>
                  <dd className="text-sm text-gray-500">{timeAgo}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    {session.end_time ? "Completed" : "Status"}
                  </dt>
                  <dd className="text-base text-gray-900">{endDate}</dd>
                </div>
              </dl>
            </div>
          </div>

          {session.activity_type === "quiz" && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Performance
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Total Questions
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {session.total_questions || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Correct Answers
                    </dt>
                    <dd className="text-2xl font-semibold text-green-600">
                      {session.correct_answers || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Success Rate
                    </dt>
                    <dd className="text-2xl font-semibold text-blue-600">
                      {session.total_questions
                        ? `${Math.round(
                            ((session.correct_answers || 0) /
                              session.total_questions) *
                              100
                          )}%`
                        : "N/A"}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
