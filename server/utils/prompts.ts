export const GENERATE_QUESTIONS_PROMPT = (jobRole: string, technologies: string[], customPrompt?: string) => {
  const techList = technologies.join(", ");
  const additionalContext = customPrompt ? `\n\nAdditional requirements: ${customPrompt}` : "";

  return `Generate exactly 6 interview questions for a ${jobRole} position using these technologies: ${techList}

Requirements:
- 2 Easy MCQ questions (60 seconds each, 10 points each)
- 2 Medium short answer questions (120 seconds each, 20 points each)
- 2 Hard coding questions (180 seconds each, 30 points each)

For MCQ questions:
- Provide exactly 4 options
- Mark the correct answer clearly
- Focus on fundamental concepts

For Short Answer questions:
- Include 5 relevant keywords for evaluation
- Set word limits: min 30, max 150 words
- Test conceptual understanding

For Code questions:
- Provide starter code template
- Include complete sample solution
- Add 4 evaluation criteria
- Choose practical, real-world problems

Make questions progressive in difficulty and relevant to actual job requirements.${additionalContext}

Ensure all questions are technically accurate, appropriate for the role level, practical and job-relevant, clear and unambiguous.`;
};

export const GENERATE_QUESTIONS_SYSTEM = "You are an expert technical interviewer creating high-quality interview questions. Generate questions that accurately assess candidate skills for the specified role.";

export const REGENERATE_QUESTION_PROMPT = (modificationRequest: string, currentQuestion?: any) => {
  const currentQuestionContext = currentQuestion ?
    `\n\nCurrent question to modify:\nType: ${currentQuestion.type}\nDifficulty: ${currentQuestion.difficulty}\nQuestion: ${currentQuestion.questionText}` :
    "";

  return `Regenerate this interview question based on the modification request.

Modification Request: ${modificationRequest}${currentQuestionContext}

Requirements:
- Maintain the same question type and difficulty level
- Apply the requested modifications
- Ensure technical accuracy
- Keep the same time limit and point structure
- For MCQ: provide 4 options with clear correct answer
- For Short Answer: include 5 relevant keywords, 30-150 word limits
- For Code: include starter code, sample solution, and 4 evaluation criteria

Generate a single improved question that addresses the modification request.`;
};

export const REGENERATE_QUESTION_SYSTEM = "You are an expert technical interviewer. Modify the question according to the specific request while maintaining quality and technical accuracy.";

export const CHATBOT_SYSTEM_PROMPT = (currentData: { email: string; phone: string }, missingFields: string[]) => `You are a friendly assistant helping collect missing contact information from a resume.
Current data: Email=${currentData.email || 'missing'}, Phone=${currentData.phone || 'missing'}
Missing fields: ${missingFields.join(', ')}

Your tasks:
1. Extract email and phone from the user's messages (handle typos, natural language like "five five five", etc.)
2. Validate the extracted data
3. Provide friendly, conversational responses
4. Ask for the next missing field if needed

Be conversational and helpful. Handle variations like:
- "my email is john dot doe at gmail dot com"
- "call me at five five five one two three four five six seven"
- Typos and formatting issues`;

export const CHATBOT_USER_PROMPT = (conversationHistory: string) =>
  `Conversation so far:\n${conversationHistory}\n\nExtract and validate email and phone information.`;