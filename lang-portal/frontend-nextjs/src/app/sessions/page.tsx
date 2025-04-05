// app/sessions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Navigation from "@/components/Navigation";

// Types
interface StudySession {
  id: number;
  group_id: number;
  study_activity_id: number;
  start_time: string;
  end_time: string | null;
  group_name?: string;
  activity_name?: string;
  activity_type?: string;
  score?: number;
  correct_answers?: number;
  total_questions?: number;
  active_time_seconds?: number | null;
}

interface FilterOptions {
  activityType: string;
  dateRange: string;
  groupId?: number;
}

interface SessionResponse {
  id: number;
  question_id: number;
  user_response: string;
  is_correct: boolean;
  english: string;
  arabic: string;
  romanized: string;
  created_at: string;
}

// Data fetching functions
const fetchStudySessions = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/study-sessions");
  if (!response.ok) throw new Error("Failed to fetch study sessions");
  return response.json();
};

const fetchSessionDetails = async (id: number) => {
  const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${id}`);
  if (!response.ok) throw new Error("Failed to fetch session details");
  return response.json();
};

const fetchStudyActivities = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/study-activities");
  if (!response.ok) throw new Error("Failed to fetch study activities");
  return response.json();
};

const fetchGroups = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/groups");
  if (!response.ok) throw new Error("Failed to fetch groups");
  return response.json();
};

const fetchSessionResponses = async (sessionId: number) => {
  const response = await fetch(
    `http://127.0.0.1:5000/api/study-sessions/${sessionId}/responses`
  );
  if (!response.ok) throw new Error("Failed to fetch detailed results");
  return response.json();
};
const resumeSession = async (
  sessionId: number,
  router: ReturnType<typeof useRouter>
) => {
  try {
    // First, fetch the session data to determine the activity type
    const response = await fetch(
      `http://127.0.0.1:5000/api/study-sessions/${sessionId}/resume`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to resume session");
    }

    const sessionData = await response.json();
    console.log("Resumed session data:", sessionData);

    // Now redirect based on the activity type
    if (sessionData.activity_type === "quiz") {
      router.push(`/quiz?resume=${sessionId}`);
    } else if (sessionData.activity_type === "game") {
      router.push(`/game?resume=${sessionId}`);
    } else if (sessionData.activity_type === "flashcards") {
      router.push(`/flashcards?resume=${sessionId}`);
    } else {
      // For other activity types, we'll use the study/[id] page
      // but pass resume parameter to enable proper resuming
      router.push(
        `/study/${sessionData.study_activity_id}?resume=${sessionId}`
      );
    }
  } catch (error) {
    console.error("Error resuming session:", error);
    alert("Failed to resume session. Please try again.");
  }
};

// Detailed Results Modal Component
function DetailedResultsModal({
  sessionId,
  onClose,
}: {
  sessionId: number;
  onClose: () => void;
}) {
  const [responses, setResponses] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchSessionResponses(sessionId);
        const responsesWithIds = data.map((r: SessionResponse, i: number) => ({
          ...r,
          id: r.id || i + 1, // Provide numerical fallback
        }));
        setResponses(responsesWithIds);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [sessionId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Detailed Session Results</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center">Loading detailed results...</div>
          ) : (
            <div className="space-y-4">
              {responses.length === 0 ? (
                <p className="text-gray-500">
                  No response data available for this session.
                </p>
              ) : (
                responses.map((response) => (
                  <div
                    key={`response-${response.id}`}
                    className={`p-4 rounded-lg border ${
                      response.is_correct
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{response.english}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Correct: {response.arabic} ({response.romanized})
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          response.is_correct
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {response.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">
                        <span className="font-medium">Your answer:</span>{" "}
                        {response.user_response}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(response.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  // State management
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [detailedResultsSessionId, setDetailedResultsSessionId] = useState<
    number | null
  >(null);
  const [filters, setFilters] = useState<FilterOptions>({
    activityType: "all",
    dateRange: "all",
  });
  const itemsPerPage = 10;

  // Fetch data
  const {
    data: sessions,
    error: sessionsError,
    isLoading: sessionsLoading,
  } = useQuery({
    queryKey: ["study-sessions"],
    queryFn: fetchStudySessions,
  });

  const {
    data: activities,
    error: activitiesError,
    isLoading: activitiesLoading,
  } = useQuery({
    queryKey: ["study-activities"],
    queryFn: fetchStudyActivities,
  });

  const {
    data: groups,
    error: groupsError,
    isLoading: groupsLoading,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  const {
  data: sessionDetails,
  error: detailsError,
  isLoading: detailsLoading,
} = useQuery({
  queryKey: ["session-details", selectedSession],
  queryFn: () => selectedSession !== null ? fetchSessionDetails(selectedSession) : null,
  enabled: selectedSession !== null,
});

  // Enrich sessions with activity and group information
  const enrichedSessions = sessions && activities && groups
    ? sessions.map((session: StudySession) => {
        const activity = activities.find((a: { id: number; name: string; type: string }) => a.id === session.study_activity_id);
        const group = groups.find((g: { id: number; name: string }) => g.id === session.group_id);
        return {
          ...session,
          activity_name: activity?.name || "Unknown Activity",
          activity_type: activity?.type || "Unknown Type",
          group_name: group?.name || "Unknown Group",
        };
      })
    : [];

  // Filter logic
  const filteredSessions = enrichedSessions
    ? enrichedSessions.filter((session: StudySession) => {
        // Filter by activity type (if not "all")
        const typeMatch =
          filters.activityType === "all" || 
          session.activity_type === filters.activityType;

        // Filter by date range
        let dateMatch = true;
        const sessionDate = new Date(session.start_time);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        switch (filters.dateRange) {
          case "today":
            dateMatch = sessionDate.toDateString() === today.toDateString();
            break;
          case "yesterday":
            dateMatch = sessionDate.toDateString() === yesterday.toDateString();
            break;
          case "week":
            dateMatch = sessionDate >= lastWeek;
            break;
          case "month":
            dateMatch = sessionDate >= lastMonth;
            break;
          default:
            dateMatch = true;
        }

        // Filter by group if specified
        const groupMatch = !filters.groupId || session.group_id === filters.groupId;

        return typeMatch && dateMatch && groupMatch;
      })
    : [];

  // Sort by most recent first
  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedSessions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Function to format duration
  const formatDuration = (activeTimeSeconds: number | null, isCompleted: boolean) => {
    if (!isCompleted) return "In progress";
    if (activeTimeSeconds === null || activeTimeSeconds === undefined) return "0s";
    
    // Convert to number in case it's a string
    const timeInSeconds = Number(activeTimeSeconds);
    if (isNaN(timeInSeconds)) return "0s";
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    
    return minutes > 0 
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;
  };

  // Function to format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Function to get session status
  const getSessionStatus = (session: StudySession) => {
    if (!session.end_time) return "In Progress";
    return "Completed";
  };

  // Function to get color for activity type
  const getActivityTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "quiz":
        return "bg-blue-100 text-blue-800";
      case "game":
        return "bg-purple-100 text-purple-800";
      case "flashcards":
        return "bg-amber-100 text-amber-800";
      case "practice":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Status color
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

  // Calculate analytics data
  const analyticsData = {
    totalSessions: sortedSessions.length,
    completedSessions: sortedSessions.filter(s => s.end_time).length,
    totalDuration: sortedSessions.reduce((total, session) => {
      if (!session.end_time) return total;
      const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
      return total + duration;
    }, 0),
    byActivityType: activities 
      ? activities.reduce((acc: Record<string, number>, activity: { type: string }) => {
          const type = activity.type;
          if (!acc[type]) acc[type] = 0;
          acc[type] += sortedSessions.filter(s => s.activity_type === type).length;
          return acc;
        }, {})
      : {}
  };

  // Format total duration for display
  const formatTotalDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Check if loading
  const isLoading = sessionsLoading || activitiesLoading || groupsLoading;
  const hasError = sessionsError || activitiesError || groupsError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Study Sessions</h1>
              <p className="mt-2 text-blue-100">
                Track your learning progress and review past study activities
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-xl font-semibold">
                {!isLoading && !hasError && sessions
                  ? `${sessions.length} Sessions Recorded`
                  : ""}
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg font-medium text-gray-600">
              Loading study sessions...
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load data. Please check your connection and try again.
          </div>
        )}

        {!isLoading && !hasError && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Sessions list & filters */}
            <div className="lg:w-2/3">
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Sessions
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsData.totalSessions}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Completed
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsData.completedSessions}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Study Time
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatTotalDuration(analyticsData.totalDuration)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Completion Rate
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsData.totalSessions > 0
                      ? `${Math.round(
                          (analyticsData.completedSessions /
                            analyticsData.totalSessions) *
                            100
                        )}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              {/* Filter controls */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Filter Sessions
                </h2>
                <div className="flex flex-wrap gap-4">
                  <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Type
                    </label>
                    <select
                      value={filters.activityType}
                      onChange={(e) =>
                        setFilters({ ...filters, activityType: e.target.value })
                      }
                      className="w-full sm:w-auto px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      <option value="quiz">Quiz</option>
                      <option value="game">Game</option>
                      <option value="flashcards">Flashcards</option>
                      <option value="practice">Practice</option>
                    </select>
                  </div>
                  <div className="w-full sm:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Range
                    </label>
                    <select
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters({ ...filters, dateRange: e.target.value })
                      }
                      className="w-full sm:w-auto px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>
                  {groups && (
                    <div className="w-full sm:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Word Group
                      </label>
                      <select
                        value={filters.groupId || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            groupId: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-full sm:w-auto px-3 py-2 border text-gray-500 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Groups</option>
                        {groups.map((group: { id: number; name: string }) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Activity
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Duration
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.length > 0 ? (
                        currentItems.map((session: StudySession) => {
                          const status = getSessionStatus(session);
                          return (
                            <tr key={session.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {session.activity_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {session.group_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActivityTypeColor(
                                    session.activity_type || ""
                                  )}`}
                                >
                                  {session.activity_type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDateTime(session.start_time)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                    status
                                  )}`}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDuration(session.active_time_seconds || null, session.end_time !== null)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="space-x-4">
                                  <button
                                    onClick={() => setSelectedSession(session.id)}
                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                  >
                                    View Details
                                  </button>
                                  {!session.end_time && (
                                    <button
                                      onClick={() => resumeSession(session.id, router)}
                                      className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
                                    >
                                      Resume
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No sessions found matching your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-4 rounded-lg shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {indexOfFirstItem + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, sortedSessions.length)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {sortedSessions.length}
                      </span>{" "}
                      sessions
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
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
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
            </div>

            {/* Right column - Session details or stats */}
            <div className="lg:w-1/3">
              {selectedSession && sessionDetails ? (
                // Selected session details
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Session Details
                    </h2>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {detailsLoading ? (
                    <div className="py-4 text-center text-gray-500">
                      Loading details...
                    </div>
                  ) : detailsError ? (
                    <div className="py-4 text-center text-red-500">
                      Failed to load session details
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-gray-200 pb-4 mb-4">
                        <h3 className="font-medium text-gray-900">
                          {sessionDetails.activity_name || "Unknown Activity"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {sessionDetails.group_name || "Unknown Group"}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Session ID
                          </h4>
                          <p className="mt-1 text-gray-500">
                            {sessionDetails.id}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">
                              Started
                            </h4>
                            <p className="mt-1 text-gray-500">
                              {formatDateTime(sessionDetails.start_time)}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">
                              Ended
                            </h4>
                            <p className="mt-1 text-gray-500">
                              {sessionDetails.end_time
                                ? formatDateTime(sessionDetails.end_time)
                                : "In progress"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500">
                            Duration
                          </h4>
                          <p className="mt-1 text-gray-500">
                            {formatDuration(sessionDetails.active_time_seconds || null, sessionDetails.end_time !== null)}
                          </p>
                        </div>

                        {/* Show score if available (for quiz/game activities) */}
                        {sessionDetails.score !== undefined && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">
                              Score
                            </h4>
                            <div className="mt-2">
                              <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-green-500 h-2"
                                  style={{ width: `${sessionDetails.score}%` }}
                                ></div>
                              </div>
                              <p className="mt-1 text-sm text-gray-700">
                                {sessionDetails.score}% (
                                {sessionDetails.correct_answers} out of{" "}
                                {sessionDetails.total_questions})
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-4 flex flex-col space-y-2">
                          {!sessionDetails.end_time && (
                            <button
                              onClick={() =>
                                resumeSession(sessionDetails.id, router)
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                            >
                              Resume Session
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setDetailedResultsSessionId(sessionDetails.id)
                            }
                            className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md text-sm font-medium"
                          >
                            View Detailed Results
                          </button>
                          <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md text-sm font-medium">
                            Retry This Activity
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Statistics and tips when no session is selected
                <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Learning Insights
                  </h2>

                  {/* Activity Type Distribution */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Activity Distribution
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.byActivityType).map(
                        ([type, count]) => (
                          <div key={type} className="flex items-center">
                            <span
                              className={`h-3 w-3 rounded-full mr-2 ${getActivityTypeColor(
                                type
                              )}`}
                            ></span>
                            <span className="text-sm text-gray-700 flex-grow">
                              {type}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {count as number}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Learning Tips */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Learning Tips
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-700 mb-2">
                        Regular practice is key to language mastery. Try to
                        study for at least 15 minutes each day.
                      </p>
                      <p className="text-sm text-blue-700">
                        Mix different activity types to improve all aspects of
                        language learning: reading, writing, listening, and
                        speaking.
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Quick Actions
                    </h3>
                    <div className="flex flex-col space-y-2">
                      <Link href="/study">
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm font-medium w-full">
                          Start New Study Session
                        </button>
                      </Link>
                      <Link href="/statistics">
                        <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-md text-sm font-medium w-full">
                          View Detailed Statistics
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Detailed Results Modal */}
      {detailedResultsSessionId && (
        <DetailedResultsModal
          sessionId={detailedResultsSessionId}
          onClose={() => setDetailedResultsSessionId(null)}
        />
      )}
    </div>
  );
  // </div>
  // );
}