// app/quiz/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Navigation from "@/components/Navigation";

// Define types
type Word = {
  id: string;
  english: string;
  arabic: string;
  romanized: string;
  group_id?: number;
};

type QuizState = {
  isStarted: boolean;
  isCompleted: boolean;
  currentIndex: number;
  score: number;
  selectedWords: Word[];
  userResponses: {
    questionId: string;
    userResponse: string;
    isCorrect: boolean;
    timestamp: string;
  }[];
  sessionId: number | null;
  groupId?: number;
};

// API functions
const fetchWords = async (groupId?: number) => {
  const url = groupId 
    ? `http://127.0.0.1:5000/api/words?group_id=${groupId}`
    : "http://127.0.0.1:5000/api/words";
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch words");
  return response.json();
};

const fetchGroups = async () => {
  const response = await fetch("http://127.0.0.1:5000/api/groups");
  if (!response.ok) throw new Error("Failed to fetch groups");
  return response.json();
};

const startSession = async (data: { group_id: number; study_activity_id: number }) => {
  const response = await fetch("http://127.0.0.1:5000/api/study-sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to start session");
  return response.json();
};

const completeSession = async ({ sessionId, responses }: { 
  sessionId: number; 
  responses: Array<{
    question_id: string;
    user_response: string;
    is_correct: number;
  }>;
}) => {
  const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ responses }),
  });
  if (!response.ok) throw new Error("Failed to complete session");
  return response.json();
};

const fetchSessionDetails = async (sessionId: number) => {
  const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${sessionId}`);
  if (!response.ok) throw new Error("Failed to fetch session details");
  return response.json();
};

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizState, setQuizState] = useState<QuizState>({
    isStarted: false,
    isCompleted: false,
    currentIndex: 0,
    score: 0,
    selectedWords: [],
    userResponses: [],
    sessionId: null,
  });

  const [quizSetup, setQuizSetup] = useState({
    groupId: "",
    questionCount: 10,
    questionType: "arabic-to-english",
  });

  // Check for resume parameter or activity on initial load
  useEffect(() => {
    const resumeSessionId = searchParams.get("resume");
    const activityId = searchParams.get("activity");
    const groupId = searchParams.get("group");

    // If we have a resume session ID and we're not already in a session
    if (resumeSessionId && !quizState.isStarted && !quizState.sessionId) {
      handleResumeSession(parseInt(resumeSessionId));
    }
    // Otherwise, if we have an activity ID and we're not already in a session
    else if (activityId && !quizState.isStarted && !quizState.sessionId) {
      const fetchActivityAndPrepare = async () => {
        try {
          // Fetch activity details if needed
          const response = await fetch(
            `http://127.0.0.1:5000/api/study-activities/${activityId}`
          );
          if (!response.ok) throw new Error("Failed to fetch activity details");
          const activityData = await response.json();

          console.log("Launched quiz with activity:", activityData);

          // Set up quiz based on the activity
          setQuizSetup((prev) => ({
            ...prev,
            groupId: groupId || "",
            questionType:
              activityData.settings?.questionType || "arabic-to-english",
            questionCount: activityData.settings?.questionCount || 10,
          }));

          // If we have a group ID, automatically start the quiz
          if (groupId) {
            // We'll use a timeout to ensure the setup has been applied
            setTimeout(() => {
              prepareQuiz();
            }, 100);
          }
        } catch (error) {
          console.error("Error setting up quiz from activity:", error);
        }
      };

      fetchActivityAndPrepare();
    }
  }, [searchParams, quizState.isStarted, quizState.sessionId]);

  // Handle resuming a session
  const handleResumeSession = async (sessionId: number) => {
    try {
      // First, get the session details from the resume endpoint
      const response = await fetch(`http://127.0.0.1:5000/api/study-sessions/${sessionId}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to resume session');
      }
      
      const session = await response.json();
      
      if (!session.end_time) {
        // Fetch words for the session's group
        const words = await fetchWords(session.group_id);
        
        // Convert previous responses to the format expected by quizState
        const previousResponses = (session.previous_responses || []).map((r: any) => ({
          questionId: r.question_id,
          userResponse: r.user_response,
          isCorrect: r.is_correct
        }));

        // Filter out words that have already been answered
        const answeredWordIds = new Set(previousResponses.map((r: { questionId: string }) => r.questionId));
        const remainingWords = words.filter((w: Word) => !answeredWordIds.has(w.id));
        
        // Combine answered words and remaining words in correct order
        const answeredWords = previousResponses.map((r: { questionId: string }) => 
          words.find((w: Word) => w.id === r.questionId)
        ).filter(Boolean);
        
        const allWords = [...answeredWords, ...remainingWords];
        
        setQuizState({
          isStarted: true,
          isCompleted: false,
          currentIndex: previousResponses.length,
          score: previousResponses.filter((r: any) => r.isCorrect).length,
          selectedWords: allWords.slice(0, session.total_questions || 10),
          userResponses: previousResponses,
          sessionId: session.id,
          groupId: session.group_id,
        });

        setQuizSetup(prev => ({
          ...prev,
          groupId: session.group_id.toString(),
          questionCount: session.total_questions || 10,
        }));
      }
    } catch (error) {
      console.error("Error resuming session:", error);
      alert("Failed to resume session. Please try again.");
    }
  };

  // Fetch all words (without group filter initially)
  const {
    data: words,
    error: wordsError,
    isLoading: wordsLoading,
  } = useQuery({
    queryKey: ["words"],
    queryFn: () => fetchWords(),
  });

  // Fetch groups
  const {
    data: groups,
    error: groupsError,
    isLoading: groupsLoading,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
  });

  // Mutations for tracking study sessions
  const startSessionMutation = useMutation({
    mutationFn: startSession,
    onSuccess: (data) => {
      setQuizState((prev) => ({
        ...prev,
        sessionId: data.id,
      }));
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: completeSession,
    onSuccess: () => {
      // No longer navigating away automatically
    },
  });

  // Select random words from the chosen group
  const prepareQuiz = () => {
    if (!words || words.length === 0) return;

    let wordPool = words;
    
    // Filter by group if selected
    if (quizSetup.groupId) {
      wordPool = words.filter((word: Word) => word.group_id === parseInt(quizSetup.groupId));
    }

    // Ensure we have enough words
    const count = Math.min(quizSetup.questionCount, wordPool.length);
    
    // Randomly select words
    const selectedWords: Word[] = [];
    const indices = new Set();
    
    while (selectedWords.length < count && selectedWords.length < wordPool.length) {
      const randomIndex = Math.floor(Math.random() * wordPool.length);
      if (!indices.has(randomIndex)) {
        indices.add(randomIndex);
        selectedWords.push(wordPool[randomIndex]);
      }
    }

    // Start the session in the backend
    startSessionMutation.mutate({
      group_id: quizSetup.groupId ? parseInt(quizSetup.groupId) : 1,
      study_activity_id: 4, // Arabic Vocabulary Quiz
    });

    // Update quiz state
    setQuizState((prev) => ({
      ...prev,
      isStarted: true,
      selectedWords,
      currentIndex: 0,
      score: 0,
      userResponses: [],
      sessionId: null, // Will be set by mutation
      groupId: quizSetup.groupId ? parseInt(quizSetup.groupId) : undefined,
    }));
  };

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    const currentWord = quizState.selectedWords[quizState.currentIndex];
    const isCorrect = 
      quizSetup.questionType === "arabic-to-english" 
        ? answer.toLowerCase() === currentWord.english.toLowerCase()
        : answer.toLowerCase() === currentWord.arabic.toLowerCase();

    // Record response with timestamp
    const newResponse = {
      questionId: currentWord.id,
      userResponse: answer,
      isCorrect,
      timestamp: new Date().toISOString(),
    };

    // Update state
    setQuizState((prev) => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      userResponses: [...prev.userResponses, newResponse],
      currentIndex: prev.currentIndex + 1,
      isCompleted: prev.currentIndex === prev.selectedWords.length - 1,
    }));

    // If quiz is complete, end the session
    if (quizState.currentIndex === quizState.selectedWords.length - 1) {
      if (quizState.sessionId) {
        completeSessionMutation.mutate({
          sessionId: quizState.sessionId,
          responses: [...quizState.userResponses, newResponse].map(r => ({
            question_id: r.questionId,
            user_response: r.userResponse,
            is_correct: r.isCorrect ? 1 : 0,
            timestamp: r.timestamp,
          })),
        });
      }
    }
  };

  // Multiple choice options for the current question
  const getOptions = () => {
    if (quizState.selectedWords.length === 0) return [];
    
    const currentWord = quizState.selectedWords[quizState.currentIndex];
    const correctAnswer = quizSetup.questionType === "arabic-to-english" 
      ? currentWord.english 
      : currentWord.arabic;
    
    // Get 3 random incorrect options
    const otherWords: Word[] = words.filter((w: Word) => 
      w.id !== currentWord.id && 
      (quizSetup.questionType === "arabic-to-english" ? w.english !== correctAnswer : w.arabic !== correctAnswer)
    );
    
    const options = [correctAnswer];
    
    // Add random incorrect options
    while (options.length < 4 && options.length < otherWords.length + 1) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const option = quizSetup.questionType === "arabic-to-english" 
        ? otherWords[randomIndex].english 
        : otherWords[randomIndex].arabic;
      
      if (!options.includes(option)) {
        options.push(option);
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  // Loading and error states
  const isLoading = wordsLoading || groupsLoading || startSessionMutation.status === "pending";
  const hasError = wordsError || groupsError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Arabic Vocabulary Quiz</h1>
              <p className="mt-2 text-blue-100">
                Test your knowledge of Arabic vocabulary
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
            <div className="text-lg font-medium text-gray-600">Loading...</div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            Failed to load data. Please check your connection and try again.
          </div>
        )}

        {!isLoading && !hasError && !quizState.isStarted && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quiz Setup
            </h2>

            <div className="space-y-4">
              {/* Group Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Word Group
                </label>
                <select
                  value={quizSetup.groupId}
                  onChange={(e) =>
                    setQuizSetup({ ...quizSetup, groupId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Groups</option>
                  {groups &&
                    groups.map((group: { id: number; name: string }) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <select
                  value={quizSetup.questionCount}
                  onChange={(e) =>
                    setQuizSetup({
                      ...quizSetup,
                      questionCount: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                </select>
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <div className="flex flex-col space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="questionType"
                      value="arabic-to-english"
                      checked={quizSetup.questionType === "arabic-to-english"}
                      onChange={() =>
                        setQuizSetup({
                          ...quizSetup,
                          questionType: "arabic-to-english",
                        })
                      }
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">Arabic to English</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="questionType"
                      value="english-to-arabic"
                      checked={quizSetup.questionType === "english-to-arabic"}
                      onChange={() =>
                        setQuizSetup({
                          ...quizSetup,
                          questionType: "english-to-arabic",
                        })
                      }
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">English to Arabic</span>
                  </label>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <button
                  onClick={prepareQuiz}
                  disabled={startSessionMutation.status === "loading"}
                  className="w-full text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-md font-medium"
                >
                  {startSessionMutation.status === "loading"
                    ? "Starting Quiz..."
                    : "Start Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading &&
          !hasError &&
          quizState.isStarted &&
          !quizState.isCompleted && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Quiz Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-gray-500">
                    Question {quizState.currentIndex + 1} of{" "}
                    {quizState.selectedWords.length}
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    Score: {quizState.score}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        (quizState.currentIndex /
                          quizState.selectedWords.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Current Question */}
              {quizState.selectedWords.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    {quizSetup.questionType === "arabic-to-english"
                      ? "What is the English translation?"
                      : "What is the Arabic word?"}
                  </h3>

                  <div className="bg-blue-50 p-6 rounded-lg text-center mb-6 text-indigo-600">
                    <p
                      className={`${
                        quizSetup.questionType === "arabic-to-english"
                          ? "text-3xl"
                          : "text-xl"
                      } font-bold`}
                    >
                      {quizSetup.questionType === "arabic-to-english"
                        ? quizState.selectedWords[quizState.currentIndex].arabic
                        : quizState.selectedWords[quizState.currentIndex]
                            .english}
                    </p>

                    {quizSetup.questionType === "arabic-to-english" && (
                      <p className="text-indigo-600 mt-2">
                        {
                          quizState.selectedWords[quizState.currentIndex]
                            .romanized
                        }
                      </p>
                    )}
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-1 gap-3">
                    {getOptions().map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-md text-left transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* This block will be shown after the quiz completes but before navigation */}
        {!isLoading &&
          !hasError &&
          quizState.isStarted &&
          quizState.isCompleted && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quiz Completed!
              </h2>

              <div className="bg-blue-50 rounded-lg p-8 mb-6">
                <p className="text-lg text-gray-700 mb-2">Your Score</p>
                <p className="text-5xl font-bold text-blue-700 mb-4">
                  {quizState.score} / {quizState.selectedWords.length}
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {Math.round(
                    (quizState.score / quizState.selectedWords.length) * 100
                  )}
                  %
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                Your session has been recorded. You can review this session and
                all your progress in the Sessions page.
              </p>

              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                <button
                  onClick={() => router.push("/sessions")}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium"
                >
                  View All Sessions
                </button>
                <button
                  onClick={() => {
                    setQuizState({
                      isStarted: false,
                      isCompleted: false,
                      currentIndex: 0,
                      score: 0,
                      selectedWords: [],
                      userResponses: [],
                      sessionId: null,
                    });
                  }}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-6 rounded-md font-medium"
                >
                  Start New Quiz
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}