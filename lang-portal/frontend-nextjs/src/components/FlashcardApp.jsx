"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Check, Mic, Volume2 } from "lucide-react";

// Sample data structure - replace with your actual data or proper API calls
const sampleData = {
  essentials: [
    { arabic: "مرحبا", english: "Hello", transliteration: "Marhaba" },
    { arabic: "شكرا", english: "Thank you", transliteration: "Shukran" },
    { arabic: "من فضلك", english: "Please", transliteration: "Min fadlak" },
  ],
  food: [
    { arabic: "خبز", english: "Bread", transliteration: "Khubz" },
    { arabic: "جبنة", english: "Cheese", transliteration: "Jubnah" },
    { arabic: "تفاحة", english: "Apple", transliteration: "Tufaha" },
  ],
};

const decks = [
  "essentials",
  "food",
  "shopping",
  "travel",
  "drinks",
  "objects",
  "adjectives",
  "verbs",
];

export default function FlashcardApp() {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [dataLoadError, setDataLoadError] = useState(false);

  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState("");
  const [pronunciationFeedback, setPronunciationFeedback] = useState(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition only once
  useEffect(() => {
    // Initialize speech recognition
    if (
      (typeof window !== "undefined" && "SpeechRecognition" in window) ||
      "webkitSpeechRecognition" in window
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 3;

      recognitionRef.current.onresult = (event) => {
        // Check if flashcards are loaded before processing speech
        if (!flashcards || flashcards.length === 0 || !flashcards[index]) {
          console.error("No flashcards loaded or invalid index");
          setPronunciationFeedback({
            correct: false,
            message: "Error: Please load a flashcard deck first.",
            similarity: 0,
          });
          setIsListening(false);
          return;
        }

        // Get best transcript
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Speech detected:", transcript);
        setSpeechResult(transcript);
        checkPronunciation(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        // Show error feedback
        setPronunciationFeedback({
          correct: false,
          message: "I couldn't hear you. Please try again.",
          similarity: 0,
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      // Clean up speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Load deck data when a deck is selected
  useEffect(() => {
    if (selectedDeck) {
      loadDeck(selectedDeck);
    }
  }, [selectedDeck]);

  const checkPronunciation = (transcript) => {
    // First, check if flashcards array and the current index are valid
    if (!flashcards || !flashcards[index]) {
      console.error("No flashcard available at current index:", index);
      setPronunciationFeedback({
        correct: false,
        message:
          "Error: Could not check pronunciation. Please try again later.",
        similarity: 0,
      });
      return;
    }

    const currentWord = flashcards[index];

    // Ensure the current word has a transliteration property
    if (!currentWord.transliteration) {
      console.error("Current flashcard has no transliteration:", currentWord);
      setPronunciationFeedback({
        correct: false,
        message: "Error: This card has no pronunciation guide.",
        similarity: 0,
      });
      return;
    }

    // Compare spoken word with transliteration (case insensitive)
    // We'll also use a relaxed comparison by removing spaces
    const normalizedTranscript = transcript.toLowerCase().replace(/\s+/g, "");
    const normalizedTarget = currentWord.transliteration
      .toLowerCase()
      .replace(/\s+/g, "");

    // For simple string similarity check
    const similarity = calculateStringSimilarity(
      normalizedTranscript,
      normalizedTarget
    );

    console.log("Pronunciation similarity:", similarity);

    if (similarity > 0.7) {
      setPronunciationFeedback({
        correct: true,
        message: "Great pronunciation!",
        similarity: similarity,
      });
    } else if (similarity > 0.4) {
      setPronunciationFeedback({
        correct: false,
        message: "Close! Try again.",
        similarity: similarity,
      });
    } else {
      setPronunciationFeedback({
        correct: false,
        message: `Try again. Expected "${currentWord.transliteration}".`,
        similarity: similarity,
      });
    }

    // Keep feedback visible a bit longer
    setTimeout(() => {
      setPronunciationFeedback(null);
    }, 4000);
  };

  // Simple string similarity calculation using Levenshtein distance
  const calculateStringSimilarity = (a, b) => {
    if (a.length === 0) return 0;
    if (b.length === 0) return 0;

    const matrix = Array(a.length + 1)
      .fill()
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) {
      matrix[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    // Calculate similarity as 1 - (distance / max length)
    const maxLength = Math.max(a.length, b.length);
    return 1 - matrix[a.length][b.length] / maxLength;
  };

  const startSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        // Check if we have valid flashcards to work with
        if (!flashcards || flashcards.length === 0 || !flashcards[index]) {
          console.error("No flashcards to practice with");
          return;
        }

        // Clear previous results
        setSpeechResult("");
        setPronunciationFeedback(null);

        // Set language to English since we're comparing with transliteration
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.maxAlternatives = 3;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsListening(false);
      }
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };

  const renderPronunciationFeedback = () => {
    if (!pronunciationFeedback) return null;
    if (!flashcards || flashcards.length === 0 || index >= flashcards.length)
      return null;

    return (
      <div
        className={`mt-4 text-center p-3 rounded-lg ${
          pronunciationFeedback.correct
            ? "bg-green-100 border border-green-300"
            : "bg-red-100 border border-red-300"
        } transition-all duration-300`}
      >
        <p
          className={`text-lg flex items-center justify-center ${
            pronunciationFeedback.correct ? "text-green-700" : "text-red-700"
          }`}
        >
          {pronunciationFeedback.correct ? (
            <Check className="mr-2 h-5 w-5" />
          ) : (
            <AlertCircle className="mr-2 h-5 w-5" />
          )}
          {pronunciationFeedback.message}
        </p>

        {!pronunciationFeedback.correct &&
          flashcards[index]?.transliteration && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Try saying:{" "}
                <span className="font-bold">
                  {flashcards[index].transliteration}
                </span>
              </p>
              <Button
                onClick={playAudio}
                className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-lg shadow-md hover:bg-blue-600"
              >
                <Volume2 className="mr-1 h-3 w-3" /> Listen Again
              </Button>
            </div>
          )}

        {/* Visualization of how close the pronunciation was */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              pronunciationFeedback.similarity > 0.7
                ? "bg-green-500"
                : pronunciationFeedback.similarity > 0.4
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{
              width: `${Math.max(5, pronunciationFeedback.similarity * 100)}%`,
            }}
          ></div>
        </div>
      </div>
    );
  };

  async function loadDeck(deck) {
    setLoading(true);
    setDataLoadError(false);

    try {
      // First try to fetch from the API
      try {
        const response = await fetch(`/data/${deck}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load deck: ${response.statusText}`);
        }
        const data = await response.json();
        setFlashcards(data);
      } catch (fetchError) {
        console.error("Error fetching from API:", fetchError);

        // Fallback to sample data if available
        if (sampleData[deck]) {
          console.log("Using sample data for", deck);
          setFlashcards(sampleData[deck]);
        } else {
          console.error("No sample data available for", deck);
          setDataLoadError(true);
          throw new Error("No data available for this deck");
        }
      }

      // Reset states for the new deck
      setIndex(0);
      setFlipped(false);
      setQuizMode(false);
      setQuizCompleted(false);
      setQuizIndex(0);
      setQuizScore(0);

      // Clear any previous speech results or feedback
      setSpeechResult("");
      setPronunciationFeedback(null);
    } catch (error) {
      console.error("Error loading deck:", error);
      setDataLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  const handleNext = () => {
    setFlipped(false);
    setIndex((prev) => (prev + 1) % flashcards.length);
    setSpeechResult("");
    setPronunciationFeedback(null);
  };

  const handlePrev = () => {
    setFlipped(false);
    setIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setSpeechResult("");
    setPronunciationFeedback(null);
  };

  const playAudio = () => {
    if (
      !flashcards ||
      (!quizMode && !flashcards[index]) ||
      (quizMode && !quizQuestions[quizIndex])
    ) {
      console.error("Cannot play audio - no card selected");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      quizMode ? quizQuestions[quizIndex].arabic : flashcards[index].arabic
    );
    utterance.lang = "ar-SA";
    speechSynthesis.speak(utterance);
  };

  const startQuiz = () => {
    if (!flashcards || flashcards.length < 5) {
      console.error("Not enough flashcards to start a quiz");
      return;
    }

    const shuffled = [...flashcards]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(5, flashcards.length));
    const questions = shuffled.map((q) => {
      // Get options, making sure we have enough options
      let options = [];
      if (flashcards.length >= 4) {
        options = [...flashcards]
          .filter((item) => item.english !== q.english)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
      } else {
        // If not enough cards, create duplicate options
        options = [
          { ...q, id: "duplicate1" },
          { ...q, id: "duplicate2" },
        ];
      }
      options.push(q);
      return { ...q, options: options.sort(() => 0.5 - Math.random()) };
    });
    setQuizQuestions(questions);
    setQuizMode(true);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const handleQuizAnswer = (answer) => {
    if (answer === quizQuestions[quizIndex].english) {
      setQuizScore((prev) => prev + 1);
    }
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const returnToCategories = () => {
    setSelectedDeck(null);
    setQuizMode(false);
    setSpeechResult("");
    setPronunciationFeedback(null);
  };

  // Category selection page
  const renderCategorySelection = () => {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
          Arabic Flashcards
        </h1>
        <p className="text-lg text-center text-gray-600 mb-12">
          Select a category to start practicing your Arabic vocabulary
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {decks.map((deck) => (
            <Card
              key={deck}
              className="p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer bg-white rounded-xl"
              onClick={() => setSelectedDeck(deck)}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {deck === "essentials" && "🛠️"}
                  {deck === "food" && "🍎"}
                  {deck === "shopping" && "🛍️"}
                  {deck === "travel" && "✈️"}
                  {deck === "drinks" && "🍹"}
                  {deck === "adjectives" && "📚"}
                  {deck === "verbs" && "📖"}
                  {deck === "objects" && "📦"}
                </div>
                <h2 className="text-xl font-semibold mb-2 text-gray-600">
                  {deck.charAt(0).toUpperCase() + deck.slice(1)}
                </h2>
                <p className="text-gray-600">
                  {deck === "essentials" &&
                    "Basic phrases and words for everyday use"}
                  {deck === "food" &&
                    "Vocabulary for meals, ingredients and dining"}
                  {deck === "shopping" && "Terms for shopping and transactions"}
                  {deck === "travel" &&
                    "Phrases useful for transportation and tourism"}
                  {deck === "drinks" && "Vocabulary for drinks and beverages"}
                  {deck === "adjectives" && "Adjectives and their meanings"}
                  {deck === "verbs" && "Verbs and their meanings"}
                  {deck === "objects" && "Common Objects and their meanings"}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Flashcard practice page
  const renderFlashcards = () => {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={returnToCategories}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
          >
            ← Back to Categories
          </Button>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
          {selectedDeck.charAt(0).toUpperCase() + selectedDeck.slice(1)}{" "}
          Flashcards
        </h1>

        {loading ? (
          <div className="w-full flex justify-center">
            <p className="text-gray-600 text-lg">Loading...</p>
          </div>
        ) : dataLoadError ? (
          <div className="w-full flex flex-col items-center justify-center">
            <p className="text-red-600 text-lg mb-4">
              Unable to load flashcard data for this category.
            </p>
            <Button
              onClick={returnToCategories}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
            >
              Return to Categories
            </Button>
          </div>
        ) : flashcards.length === 0 ? (
          <div className="w-full flex justify-center">
            <p className="text-gray-600 text-lg">
              No flashcards available for this category.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {/* Fixed-size flashcard container */}
            <div className="w-full max-w-xl aspect-[4/3] mb-4">
              <motion.div
                className="relative w-full h-full rounded-2xl shadow-xl bg-white flex items-center justify-center cursor-pointer overflow-hidden"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
                onClick={() => setFlipped(!flipped)}
                style={{ perspective: 1000 }}
              >
                <div
                  className={`absolute inset-0 flex items-center justify-center p-6 transition-all duration-300 ${
                    flipped ? "scale-x-[-1]" : ""
                  }`}
                >
                  <div className="text-center">
                    {flipped ? (
                      <span className="text-4xl md:text-5xl font-bold break-words text-gray-500">
                        {flashcards[index].english}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <span className="text-4xl md:text-5xl font-bold break-words text-gray-500">
                          {flashcards[index].arabic}
                        </span>
                        <span className="text-xl md:text-2xl text-gray-600 italic">
                          {flashcards[index].transliteration}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            <p className="mt-2 text-gray-700 text-lg">
              Card {index + 1} of {flashcards.length}
            </p>

            {/* Pronunciation result display */}
            {speechResult && (
              <div className="mt-4 text-center">
                <p className="text-lg">
                  You said:{" "}
                  <span className="font-semibold">{speechResult}</span>
                </p>
              </div>
            )}

            {/* Use the renderPronunciationFeedback function */}
            {renderPronunciationFeedback()}

            {/* Show listening indicator */}
            {isListening && (
              <div className="mt-4 text-center p-3 rounded-lg bg-blue-100 border border-blue-300 animate-pulse">
                <p className="text-lg flex items-center justify-center text-blue-700">
                  <Mic className="mr-2 h-5 w-5" />
                  Listening... Please speak now
                </p>
              </div>
            )}

            <div className="flex mt-6 gap-4">
              <Button
                onClick={handlePrev}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
              >
                Prev
              </Button>
              <Button
                onClick={playAudio}
                className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
              >
                <Volume2 className="mr-1 h-4 w-4" /> Listen
              </Button>
              <Button
                onClick={handleNext}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600"
              >
                Next
              </Button>
            </div>

            <div className="mt-12 text-center">
              <Button
                onClick={startQuiz}
                className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 text-lg"
              >
                Test Your Knowledge
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Quiz mode
  const renderQuiz = () => {
    return quizCompleted ? (
      <Card className="p-8 shadow-xl rounded-xl bg-white max-w-2xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Quiz Completed!</h2>
          <p className="text-xl mb-2">
            Your Score: {quizScore} / {quizQuestions.length}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4 mb-6">
            <div
              className="bg-green-500 h-4 rounded-full"
              style={{
                width: `${(quizScore / quizQuestions.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => setQuizMode(false)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 text-lg"
            >
              Back to Flashcards
            </Button>
            <Button
              onClick={returnToCategories}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 text-lg"
            >
              Change Category
            </Button>
          </div>
        </div>
      </Card>
    ) : (
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => setQuizMode(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600"
          >
            ← Back to Flashcards
          </Button>
        </div>

        {/* Fixed-size quiz card container with absolutely fixed dimensions */}
        <div className="w-full h-96 md:h-112">
          <Card className="p-8 shadow-xl rounded-xl bg-white w-full h-full flex flex-col">
            <div className="flex flex-col h-full">
              {/* Question container with fixed height */}
              <div className="h-36 flex flex-col items-center justify-center mb-4">
                <h2 className="text-2xl font-bold text-center mb-2">
                  What is the meaning of:
                </h2>
                <p className="text-2xl font-bold text-center mb-1">
                  "{quizQuestions[quizIndex]?.arabic}"
                </p>
                <p className="text-lg text-gray-600 italic">
                  ({quizQuestions[quizIndex]?.transliteration})
                </p>
              </div>

              <div className="flex justify-center mb-6">
                <Button
                  onClick={playAudio}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600"
                >
                  <Volume2 className="mr-1 h-4 w-4" /> Listen
                </Button>
              </div>

              {/* Options grid with fixed height */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                {quizQuestions[quizIndex]?.options.map((option, i) => (
                  <Button
                    key={i}
                    onClick={() => handleQuizAnswer(option.english)}
                    className="px-4 py-4 bg-gray-200 text-gray-800 rounded-lg shadow-md hover:bg-gray-300 text-lg flex items-center justify-center h-full overflow-hidden"
                  >
                    <span className="text-center break-words">
                      {option.english}
                    </span>
                  </Button>
                ))}
              </div>

              <div className="h-10 flex items-center justify-center mt-6">
                <p className="text-gray-600">
                  Question {quizIndex + 1} of {quizQuestions.length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-4 md:p-8">
      {!selectedDeck
        ? renderCategorySelection()
        : quizMode
        ? renderQuiz()
        : renderFlashcards()}
    </div>
  );
}
