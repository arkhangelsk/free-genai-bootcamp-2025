"use client";

import Navigation from '@/components/Navigation';
import { useQuery } from '@tanstack/react-query';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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

const fetchStudyStats = async (): Promise<StudyStats> => {
  const response = await fetch('http://127.0.0.1:5000/api/study-sessions/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch study statistics');
  }
  return response.json();
};

export default function StatisticsPage() {
  const { data: stats, isLoading, error } = useQuery<StudyStats>({
    queryKey: ['studyStats'],
    queryFn: fetchStudyStats,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Loading statistics...</h1>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-2 gap-8">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Statistics</h1>
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">Failed to load statistics</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for the study time chart
  const studyTimeData: ChartData<'line'> = {
    labels: stats?.daily_activity.map(day => format(new Date(day.study_date), 'MMM d')) || [],
    datasets: [
      {
        label: 'Study Time (minutes)',
        data: stats?.daily_activity.map(day => day.minutes_studied) || [],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Prepare data for activity breakdown
  const activityCounts = stats?.activity_types.reduce((acc, curr) => {
    acc[curr.activity_type] = curr.session_count;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate performance metrics
  const quizAverage = stats?.average_scores.find(score => score.activity_type === 'quiz')?.average_score || 0;
  const gameAverage = stats?.average_scores.find(score => score.activity_type === 'game')?.average_score || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Learning Statistics</h1>
              <p className="mt-2 text-blue-100">
                Track your progress and analyze your performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation with improved styling */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <Navigation />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Detailed Statistics
        </h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Total Sessions
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats?.total_sessions || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">
              Completion Rate
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {stats
                ? Math.round(
                    (stats.completed_sessions / stats.total_sessions) * 100
                  )
                : 0}
              %
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Quiz Average</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(quizAverage)}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Game Average</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(gameAverage)}%
            </p>
          </div>
        </div>

        {/* Study Time Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Study Time
          </h2>
          <div className="h-64">
            <Line
              data={studyTimeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top" as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Minutes",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activity Breakdown
            </h2>
            <div className="space-y-4">
              {Object.entries(activityCounts).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-600 capitalize">{type}</span>
                  <span className="text-purple-600 font-semibold">
                    {count} sessions
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Summary
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Total Study Time
                </h3>
                <p className="text-xl font-semibold text-gray-900">
                  {Math.round((stats?.total_minutes || 0) / 60)} hours
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Average Session Length
                </h3>
                <p className="text-xl font-semibold text-gray-900">
                  {stats
                    ? Math.round(stats.total_minutes / stats.total_sessions)
                    : 0}{" "}
                  minutes
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Completed Sessions
                </h3>
                <p className="text-xl font-semibold text-gray-900">
                  {stats?.completed_sessions || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
