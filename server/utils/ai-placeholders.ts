import { generateAllQuestions, regenerateQuestion } from "./ai-integration.js";

export const generateAllQuestionsPlaceholder = async (jobRole: string, technologies: string[], customPrompt?: string) => {
  return await generateAllQuestions(jobRole, technologies, customPrompt);
};

export const regenerateQuestionPlaceholder = async (questionId: string, modificationRequest: string) => {
  return await regenerateQuestion(questionId, modificationRequest);
};