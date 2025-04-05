// components/SessionDetail.jsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
interface SessionDetailProps {
  sessionId: number;
  onClose: () => void;
}

interface SessionResponse {
  question_id: number;
  question_text?: string;
  is_correct: boolean;
  user_response: string;
  correct_answer?: string;
}

const fetchSessionResponses = async (sessionId: number) => {
  const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${sessionId}/responses`);
  if (!response.ok) throw new Error("Failed to fetch session responses");
  return response.json();
};

const SessionDetail = ({ sessionId, onClose }: SessionDetailProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch session details
  const {
    data: session,
    error: sessionError,
    isLoading: sessionLoading,
  } = useQuery({
    queryKey: ["session-details", sessionId],
    queryFn: async () => {
      const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session details");
      return response.json();
    },
  });

  // Fetch responses (for quiz/game activities)
  const {
    data: responses,
    error: responsesError,
    isLoading: responsesLoading,
  } = useQuery({
    queryKey: ["session-responses", sessionId],
    queryFn: () => fetchSessionResponses(sessionId),
    // Only fetch responses for quiz or game activities
    enabled: session?.activity_type === "quiz" || session?.activity_type === "game",
  });

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Calculate duration
  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In progress";

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;

    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  // Function to get session status
  const getSessionStatus = () => {
    if (!session?.end_time) return "In Progress";
    return "Completed";
  };

  // Function to get color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (sessionLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="py-8 text-center text-gray-500">Loading session details...</div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="py-8 text-center text-red-500">Failed to load session details</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const status = getSessionStatus();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Session Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Session header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{session.activity_name}</h3>
            <p className="text-sm text-gray-500">{session.group_name}</p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          {(session.activity_type === "quiz" || session.activity_type === "game") && (
            <button
              onClick={() => setActiveTab("results")}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === "results"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Results
            </button>
          )}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Started</h4>
              <p className="mt-1">{formatDateTime(session.start_time)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Ended</h4>
              <p className="mt-1">
                {session.end_time ? formatDateTime(session.end_time) : "In progress"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Duration</h4>
              <p className="mt-1">
                {formatDuration(session.start_time, session.end_time)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Activity Type</h4>
              <p className="mt-1 capitalize">{session.activity_type}</p>
            </div>
          </div>

          {/* Show score if available (for quiz/game activities) */}
          {session.score !== undefined && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Score</h4>
              <div className="mt-2">
                <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500 h-2"
                    style={{ width: `${session.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-sm text-gray-700">{session.score}%</p>
                  <p className="text-sm text-gray-500">
                    {session.correct_answers} of {session.total_questions} correct
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex flex-col space-y-2">
            {!session.end_time && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium">
                Resume Session
              </button>
            )}
            {session.activity_type === "quiz" || session.activity_type === "game" ? (
              <button 
                onClick={() => setActiveTab("results")}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md text-sm font-medium"
              >
                View Detailed Results
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        // Results tab for quiz/game activities
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">Response Details</h4>
          
          {responsesLoading ? (
            <div className="py-4 text-center text-gray-500">Loading responses...</div>
          ) : responsesError ? (
            <div className="py-4 text-center text-red-500">Failed to load response details</div>
          ) : responses && responses.length > 0 ? (
            <div className="mt-2 space-y-3">
              {responses.map((response: SessionResponse, index: number) => (
                <div 
                  key={response.question_id || index}
                  className={`p-3 rounded-lg ${
                    response.is_correct ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <p className="font-medium text-gray-900 mb-1">
                    {response.question_text || `Question ${index + 1}`}
                  </p>
                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Your answer:</span>{" "}
                      <span className={response.is_correct ? "text-green-700" : "text-red-700"}>
                        {response.user_response}
                      </span>
                    </div>
                    {!response.is_correct && response.correct_answer && (
                      <div>
                        <span className="text-gray-500">Correct answer:</span>{" "}
                        <span className="text-green-700">{response.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No detailed response data available for this session.
            </div>
          )}
          
          <div className="mt-4">
            <button
              onClick={() => setActiveTab("overview")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              &larr; Back to Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetail;