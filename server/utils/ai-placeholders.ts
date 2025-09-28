import { z } from "zod";

export const generateAllQuestionsPlaceholder = async (jobRole: string, technologies: string[], customPrompt?: string) => {
  return [
    {
      type: "mcq" as const,
      difficulty: "easy" as const,
      category: "React",
      questionText: "What is JSX in React?",
      options: ["JavaScript XML", "Java Syntax Extension", "JSON XML", "JavaScript Extension"],
      correctAnswer: "JavaScript XML",
      timeLimit: 20,
      points: 10
    },
    {
      type: "mcq" as const,
      difficulty: "easy" as const,
      category: "React",
      questionText: "Which hook is used for side effects?",
      options: ["useState", "useEffect", "useContext", "useMemo"],
      correctAnswer: "useEffect",
      timeLimit: 20,
      points: 10
    },
    {
      type: "short_answer" as const,
      difficulty: "medium" as const,
      category: "JavaScript",
      questionText: "Explain the concept of closures in JavaScript.",
      expectedKeywords: ["scope", "function", "variables", "lexical", "environment"],
      minWords: 30,
      maxWords: 150,
      timeLimit: 60,
      points: 20
    },
    {
      type: "short_answer" as const,
      difficulty: "medium" as const,
      category: "API",
      questionText: "What are the differences between REST and GraphQL APIs?",
      expectedKeywords: ["endpoint", "query", "over-fetching", "single", "schema"],
      minWords: 30,
      maxWords: 150,
      timeLimit: 60,
      points: 20
    },
    {
      type: "code" as const,
      difficulty: "hard" as const,
      category: "React",
      questionText: "Write a React hook that debounces a value.",
      language: "javascript",
      starterCode: "function useDebounce(value, delay) {\n  // Your implementation here\n}",
      sampleSolution: "function useDebounce(value, delay) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n\n  return debouncedValue;\n}",
      evaluationCriteria: ["Uses useEffect and useState correctly", "Implements debounce logic", "Cleans up timeout", "Returns debounced value"],
      timeLimit: 120,
      points: 30
    },
    {
      type: "code" as const,
      difficulty: "hard" as const,
      category: "Algorithm",
      questionText: "Implement a function to find the longest palindromic substring.",
      language: "javascript",
      starterCode: "function longestPalindrome(s) {\n  // Your implementation here\n}",
      sampleSolution: "function longestPalindrome(s) {\n  if (!s || s.length < 2) return s;\n  \n  let start = 0, maxLength = 1;\n  \n  for (let i = 0; i < s.length; i++) {\n    // Check for odd length palindromes\n    let len1 = expandAroundCenter(s, i, i);\n    // Check for even length palindromes\n    let len2 = expandAroundCenter(s, i, i + 1);\n    \n    let len = Math.max(len1, len2);\n    if (len > maxLength) {\n      maxLength = len;\n      start = i - Math.floor((len - 1) / 2);\n    }\n  }\n  \n  return s.substring(start, start + maxLength);\n}\n\nfunction expandAroundCenter(s, left, right) {\n  while (left >= 0 && right < s.length && s[left] === s[right]) {\n    left--;\n    right++;\n  }\n  return right - left - 1;\n}",
      evaluationCriteria: ["Correct algorithm implementation", "Handles edge cases", "Efficient solution", "Clean code structure"],
      timeLimit: 120,
      points: 30
    }
  ];
};

export const regenerateQuestionPlaceholder = async (questionId: string, modificationRequest: string) => {
  return {
    type: "mcq" as const,
    difficulty: "easy" as const,
    category: "JavaScript",
    questionText: "What is the difference between const and let in JavaScript?",
    options: ["const is block-scoped, let is function-scoped", "let is block-scoped, const is function-scoped", "Both are block-scoped, const cannot be reassigned", "Both are function-scoped"],
    correctAnswer: "Both are block-scoped, const cannot be reassigned",
    timeLimit: 20,
    points: 10
  };
};