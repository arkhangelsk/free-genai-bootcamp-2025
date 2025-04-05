"use client";

import { useQuery } from "@tanstack/react-query";

interface StudyStats {
  total_sessions: number;
  completed_sessions: number;
  total_minutes: number;
  activity_types: Array<{
    activity_type: string;
    session_count: number;
  }>;
  average_scores: Array<{
    activity_type: string;
    average_score: number;
  }>;
  daily_activity: Array<{
    study_date: string;
    session_count: number;
    minutes_studied: number;
  }>;
}

type StudyProgressProps = {
  totalWords: number;
};

const fetchStudyStats = async (): Promise<StudyStats> => {
  const response = await fetch("http://127.0.0.1:5000/api/study-sessions/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch study statistics");
  }
  return response.json();
};

export default function StudyProgress({ totalWords }: StudyProgressProps) {
  const { data: stats, isLoading, error } = useQuery<StudyStats>({
    queryKey: ["studyStats"],
    queryFn: fetchStudyStats,
  });

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Study Progress</h2>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-3"></div>
          <div className="h-3 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Study Progress</h2>
        <p className="text-red-600">Failed to load study progress</p>
      </div>
    );
  }

  // Calculate various metrics
  const totalSessions = stats?.total_sessions || 0;
  const completedSessions = stats?.completed_sessions || 0;
  const totalMinutes = stats?.total_minutes || 0;
  
  // Calculate completion percentage based on completed sessions
  const percentage =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Calculate average time per session (in minutes)
  const avgTimePerSession =
    completedSessions > 0
      ? Math.round(totalMinutes / completedSessions)
      : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Study Progress</h2>

      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="font-medium text-3xl text-blue-600">{percentage}%</p>
          <p className="text-sm text-gray-500">completion rate</p>
        </div>
        <p className="text-gray-700 font-medium">
          {completedSessions} / {totalSessions} sessions
        </p>
      </div>

      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div
          className="h-3 bg-blue-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Total Study Time</p>
          <p className="font-medium text-gray-900">{totalMinutes} minutes</p>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-sm text-gray-500">Avg. Session Length</p>
          <p className="font-medium text-gray-900">{avgTimePerSession} minutes</p>
        </div>
      </div>

      {stats?.activity_types && stats.activity_types.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-500 mb-2">Activity Types</p>
          <div className="space-y-2">
            {stats.activity_types.map((type) => (
              <div
                key={type.activity_type}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-600 capitalize">
                  {type.activity_type}
                </span>
                <span className="font-medium text-gray-900">
                  {type.session_count} sessions
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
