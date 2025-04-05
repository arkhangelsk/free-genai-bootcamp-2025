"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

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

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
}

const fetchStudyStats = async (): Promise<StudyStats> => {
  const response = await fetch('http://127.0.0.1:5000/api/study-sessions/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch study statistics');
  }
  return response.json();
};

const fetchGroups = async (): Promise<Group[]> => {
  const response = await fetch('http://127.0.0.1:5000/api/groups');
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  return response.json();
};

const calculateStreak = (dailyActivity: StudyStats['daily_activity'] | undefined): number => {
  if (!dailyActivity || dailyActivity.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const sortedDates = dailyActivity
    .map((day) => day.study_date)
    .sort()
    .reverse();

  // If latest activity is not today, streak is 0
  if (sortedDates[0] !== today) return 0;

  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (
      currentDate.toISOString().split('T')[0] ===
      expectedDate.toISOString().split('T')[0]
    ) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export default function QuickStats() {
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery<StudyStats>({
    queryKey: ['studyStats'],
    queryFn: fetchStudyStats,
  });

  const {
    data: groups,
    isLoading: isGroupsLoading,
    error: groupsError,
  } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });

  const isLoading = isStatsLoading || isGroupsLoading;
  const error = statsError || groupsError;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-300">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-md">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h2>
        <p className="text-red-600">Failed to load statistics</p>
      </div>
    );
  }

  // Calculate quiz success rate (only from quiz activities)
  const quizScores = stats?.average_scores?.filter(
    (score) => score.activity_type === 'quiz'
  );
  const quizSuccessRate =
    quizScores && quizScores.length > 0
      ? Math.round(
          quizScores.reduce((acc, curr) => acc + curr.average_score, 0) /
            quizScores.length
        )
      : 0;

  // Calculate total study time in hours
  const totalStudyHours = Math.round((stats?.total_minutes || 0) / 60);

  // Calculate words learned (estimate based on completed sessions)
  // Assuming an average of 5 new words per completed session
  const wordsLearned = (stats?.completed_sessions || 0) * 5;

  const streak = calculateStreak(stats?.daily_activity);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-md text-center">
          <p className="text-sm text-gray-500">Quiz Success Rate</p>
          <p className="text-2xl font-bold text-purple-600">{quizSuccessRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Average quiz performance</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md text-center">
          <p className="text-sm text-gray-500">Total Study Time</p>
          <p className="text-2xl font-bold text-purple-600">
            {totalStudyHours}
            <span className="text-sm font-normal ml-1">hrs</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Time invested in learning</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md text-center">
          <p className="text-sm text-gray-500">Words Learned</p>
          <p className="text-2xl font-bold text-purple-600">{wordsLearned}</p>
          <p className="text-xs text-gray-400 mt-1">Estimated vocabulary growth</p>
        </div>

        <div className="bg-gray-50 p-3 rounded-md text-center">
          <p className="text-sm text-gray-500">Study Streak</p>
          <p className="text-2xl font-bold text-purple-600">
            {streak}
            <span className="text-sm font-normal ml-1">
              {streak === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Consecutive study days</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/statistics"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Detailed Statistics
        </Link>
      </div>
    </div>
  );
}
