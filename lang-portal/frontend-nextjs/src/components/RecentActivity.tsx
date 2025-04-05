"use client";

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Activity {
  id: number;
  group_name: string;
  activity_name: string;
  activity_type: string;
  start_time: string;
  end_time: string | null;
}

const fetchRecentActivity = async (): Promise<Activity[]> => {
  const response = await fetch('http://127.0.0.1:5000/api/study-sessions');
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  return response.json();
};

export default function RecentActivity() {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ['recentActivity'],
    queryFn: fetchRecentActivity,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-red-600">Failed to load recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <Link
          href="/sessions"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {activities?.slice(0, 5).map((activity) => (
          <Link
            key={activity.id}
            href={`/sessions/${activity.id}`}
            className="block hover:bg-gray-50 rounded-lg p-3 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                  activity.activity_type === 'quiz'
                    ? 'bg-purple-500'
                    : activity.activity_type === 'game'
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}>
                  {activity.activity_type === 'quiz'
                    ? 'Q'
                    : activity.activity_type === 'game'
                    ? 'G'
                    : 'P'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.activity_name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(activity.start_time), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{activity.group_name}</p>
                <p className="text-sm text-gray-500">
                  {activity.end_time ? 'Completed' : 'In Progress'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
