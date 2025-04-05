// app/study/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface StudyActivity {
  id: number;
  name: string;
  description: string;
  type: string;
  difficulty: string;
  estimated_time: string;
  instructions: string;
  content?: any;
  icon?: string;
}

interface SessionData {
  id: number;
  group_id: number;
  study_activity_id: number;
  activity_type: string;
  start_time: string;
  end_time: string | null;
  previous_responses?: any[];
  activity_details?: {
    question_type?: string;
    [key: string]: any;
  };
}

const fetchStudyActivity = async (id: string) => {
  const response = await fetch(
    `http://127.0.0.1:5000/api/study-activities/${id}`
  );
  if (!response.ok) throw new Error("Failed to fetch study activity");
  return response.json();
};

export default function StudyActivityDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [isStarted, setIsStarted] = useState(false);
  const [resumedSessionData, setResumedSessionData] =
    useState<SessionData | null>(null);

  const {
    data: activity,
    error,
    isLoading,
  } = useQuery<StudyActivity>({
    queryKey: ["study-activity", id],
    queryFn: () => fetchStudyActivity(id),
  });

  // Remove the auto-redirect effect since we'll handle it in the render

  // Handle resume functionality
  useEffect(() => {
    const resumeSessionId = searchParams.get("resume");
    if (resumeSessionId && !isNaN(parseInt(resumeSessionId)) && activity) {
      const handleResume = async () => {
        try {
          const sessionId = parseInt(resumeSessionId);

          // Make resume API call
          const resumeResponse = await fetch(
            `http://127.0.0.1:5000/api/study-sessions/${sessionId}/resume`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!resumeResponse.ok) {
            throw new Error("Failed to resume session");
          }

          const resumeData = await resumeResponse.json();
          console.log("Resumed session data:", resumeData);

          // Store resumed session data for use in activity components
          setResumedSessionData(resumeData);

          // Auto-start the activity
          setIsStarted(true);
        } catch (error) {
          console.error("Error resuming session:", error);
          alert("Failed to resume session. Please try again.");
        }
      };

      handleResume();
    }
  }, [searchParams, activity]);

  // Function to get appropriate icon based on activity type
  const getActivityIcon = (type: string, icon?: string) => {
    if (icon) return icon;

    // Default icons based on type
    switch (type?.toLowerCase()) {
      case "flashcards":
        return "📇";
      case "quiz":
        return "❓";
      case "matching":
        return "🔄";
      case "writing":
        return "✍️";
      case "listening":
        return "👂";
      case "speaking":
        return "🗣️";
      default:
        return "📚";
    }
  };

  // Function to get color scheme based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-blue-100 text-blue-800";
      case "advanced":
        return "bg-purple-100 text-purple-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to render the activity content based on its type
  const renderActivityContent = () => {
    if (!activity || !isStarted) return null;

    switch (activity.type?.toLowerCase()) {
      case "flashcards":
        return (
          <FlashcardsActivity
            content={activity.content}
            sessionData={resumedSessionData}
          />
        );
      case "quiz":
        return (
          <QuizActivity
            content={activity.content}
            sessionData={resumedSessionData}
          />
        );
      case "practice":
        return (
          <PracticeActivity
            content={activity.content}
            sessionData={resumedSessionData}
          />
        );
      // Add more activity type renders as needed
      default:
        return (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg">
            <p className="font-medium mb-2">
              This activity type is not yet fully implemented.
            </p>
            <p>
              The activity content would be displayed here. You might want to
              use one of our dedicated activity pages like Quiz or Flashcards
              instead.
            </p>
            {resumedSessionData && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-yellow-200">
                <p className="font-medium">Session Information:</p>
                <p>Session ID: {resumedSessionData.id}</p>
                <p>Activity Type: {resumedSessionData.activity_type}</p>
                <p>
                  Started:{" "}
                  {new Date(resumedSessionData.start_time).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-3xl">
            <Link
              href="/study"
              className="flex items-center text-indigo-100 hover:text-white mb-4"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Study Activities
            </Link>

            {!isLoading && !error && activity && (
              <>
                <div className="flex items-center mb-2">
                  <span className="text-3xl mr-3">
                    {getActivityIcon(activity.type, activity.icon)}
                  </span>
                  <h1 className="text-3xl font-bold">{activity.name}</h1>
                </div>
                <div className="flex items-center mt-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                      activity.difficulty
                    )} bg-opacity-20 text-black`}
                  >
                    {activity.difficulty}
                  </span>
                  <span className="ml-3 text-sm text-indigo-100">
                    {activity.estimated_time}
                  </span>
                  <span className="ml-3 text-sm text-indigo-100">
                    {activity.type}
                  </span>
                  {resumedSessionData && (
                    <span className="ml-3 px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
                      Resumed Session
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-center items-center py-12">
              <div className="text-lg font-medium text-gray-600">
                Loading activity...
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load study activity. Please check your connection and try
            again.
            <div className="mt-4">
              <button
                onClick={() => router.push("/study")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Return to Study Activities
              </button>
            </div>
          </div>
        )}

        {/* Activity details */}
        {!isLoading && !error && activity && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              {(() => {
                // Check both type and name since backend returns type as 'practice'
                if (activity.type === "practice" && activity.name === "Typing Tutor") {
                  return (
                    <iframe
                      src="/keyboard.htm"
                      className="w-full h-[800px] border-0"
                      title="Arabic Keyboard"
                    />
                  );
                }
                
                if (activity.type === "quiz" && activity.name === "Arabic Vocabulary Quiz") {
                  return (
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold mb-6">{activity.name}</h2>
                      <button
                        onClick={() => router.push('/quiz')}
                        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Start Quiz
                      </button>
                    </div>
                  );
                }

                if (activity.type === "practice`" && activity.name === "Learn Vocabulary") {
                  return (
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold mb-6">{activity.name}</h2>
                      <button
                        onClick={() => router.push('/groups')}
                        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        {/* Start Quiz */}
                      </button>
                    </div>
                  );
                }


                
                
                return (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Activity type not supported: {activity.type} ({activity.name})</p>
                  </div>
                );
              })()} 
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Example activity components - you would implement these based on your actual data structure
function FlashcardsActivity({
  content,
  sessionData,
}: {
  content: any;
  sessionData: SessionData | null;
}) {
  // This is a placeholder - implement actual flashcard UI based on your data
  return (
    <div className="p-4 text-center">
      {sessionData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
          <p className="font-medium text-blue-800">Resumed Session</p>
          <p className="text-blue-600 text-sm">
            You're continuing from where you left off. Session ID:{" "}
            {sessionData.id}
          </p>
        </div>
      )}
      <div className="bg-gray-100 p-12 rounded-lg mb-6">
        <p className="text-2xl">Your flashcard content would go here</p>
        <p className="text-gray-500 mt-4">This is a placeholder component</p>
      </div>
      <div className="flex justify-center gap-4">
        <button className="px-6 py-2 bg-gray-200 rounded-md">Previous</button>
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-md">
          Next
        </button>
      </div>
    </div>
  );
}

function QuizActivity({
  content,
  sessionData,
}: {
  content: any;
  sessionData: SessionData | null;
}) {
  // This is a placeholder - implement actual quiz UI based on your data
  return (
    <div className="p-4">
      {sessionData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="font-medium text-blue-800">Resumed Session</p>
          <p className="text-blue-600 text-sm">
            You're continuing from where you left off. Session ID:{" "}
            {sessionData.id}
          </p>
          {sessionData.previous_responses && (
            <p className="text-blue-600 text-sm mt-1">
              Previous responses: {sessionData.previous_responses.length}
            </p>
          )}
        </div>
      )}
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <p className="text-xl font-medium mb-4">Question would appear here?</p>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
            Option 1
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
            Option 2
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
            Option 3
          </div>
          <div className="bg-white p-3 rounded border border-gray-200 hover:border-indigo-500 cursor-pointer">
            Option 4
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-md">
          Submit Answer
        </button>
      </div>
    </div>
  );
}

function PracticeActivity({
  content,
  sessionData,
}: {
  content: any;
  sessionData: SessionData | null;
}) {
  // This is a placeholder for a practice activity
  return (
    <div className="p-4">
      {sessionData && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="font-medium text-blue-800">Resumed Session</p>
          <p className="text-blue-600 text-sm">
            You're continuing from where you left off. Session ID:{" "}
            {sessionData.id}
          </p>
        </div>
      )}
      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <p className="text-xl font-medium mb-4">Practice Exercise</p>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="font-medium mb-2">Practice Prompt:</p>
          <p className="text-gray-700">
            This is where your practice content would appear. For example, a
            writing prompt, speaking exercise, or other practice activity.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={5}
          placeholder="Enter your response here..."
        ></textarea>
      </div>
      <div className="flex justify-end mt-4">
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-md">
          Submit Response
        </button>
      </div>
    </div>
  );
}
