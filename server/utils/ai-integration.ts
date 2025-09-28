import { z } from "zod";
import { generateObjectWithModel, getDefaultModel } from "./ai-models.js";
import { createQuestionSchema } from "./validation.js";
import {
  GENERATE_QUESTIONS_PROMPT,
  GENERATE_QUESTIONS_SYSTEM,
  REGENERATE_QUESTION_PROMPT,
  REGENERATE_QUESTION_SYSTEM
} from "./prompts.js";

const generateAllQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema)
});

const regenerateQuestionSchema = z.object({
  question: createQuestionSchema
});

export const generateAllQuestions = async (
  jobRole: string,
  technologies: string[],
  customPrompt?: string
) => {
  const model = getDefaultModel();
  const prompt = GENERATE_QUESTIONS_PROMPT(jobRole, technologies, customPrompt);

  try {
    const result = await generateObjectWithModel(
      prompt,
      generateAllQuestionsSchema,
      model,
      GENERATE_QUESTIONS_SYSTEM
    );

    return (result as z.infer<typeof generateAllQuestionsSchema>).questions;
  } catch (error) {
    console.error("Failed to generate questions:", error);
    throw new Error("AI question generation failed. Please try again.");
  }
};

export const regenerateQuestion = async (
  _questionId: string,
  modificationRequest: string,
  currentQuestion?: any
) => {
  const model = getDefaultModel();
  const prompt = REGENERATE_QUESTION_PROMPT(modificationRequest, currentQuestion);

  try {
    const result = await generateObjectWithModel(
      prompt,
      regenerateQuestionSchema,
      model,
      REGENERATE_QUESTION_SYSTEM
    );

    return (result as z.infer<typeof regenerateQuestionSchema>).question;
  } catch (error) {
    console.error("Failed to regenerate question:", error);
    throw new Error("AI question regeneration failed. Please try again.");
  }
};