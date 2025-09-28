import { z } from "zod";
import { generateObject, generateText } from "ai";
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

const resumeExtractionSchema = z.object({
  name: z.string().describe("Full name of the person from the resume, empty string if not found"),
  email: z.string().describe("Email address from the resume, empty string if not found"),
  phone: z.string().describe("Phone number from the resume, empty string if not found"),
  confidence: z.object({
    name: z.number().min(0).max(1).describe("Confidence level for name extraction (0-1)"),
    email: z.number().min(0).max(1).describe("Confidence level for email extraction (0-1)"),
    phone: z.number().min(0).max(1).describe("Confidence level for phone extraction (0-1)")
  }).describe("Confidence scores for each extracted field"),
  missing_fields: z.array(z.enum(["name", "email", "phone"])).describe("List of fields that could not be extracted or have low confidence")
}).describe("Extracted personal information from resume");

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

export const extractResumeData = async (
  fileData: ArrayBuffer,
  mimeType: string
) => {
  const { models } = await import("./ai-models.js");
  const model = models.gpt4o || models.gpt4omini || models.gemini25flash || models.gemini25flashlite;

  if (!model) {
    throw new Error("No file-processing capable AI model available. Please configure OpenAI or Google models.");
  }

  try {
    const { object } = await generateObject({
      model,
      schema: resumeExtractionSchema,
      system: "You are an expert at extracting personal information from resumes. Extract the name, email, and phone number from the provided resume file. If any field is missing or unclear, mark it in the missing_fields array and give it a low confidence score.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: new Uint8Array(fileData),
              mediaType: mimeType,
            },
            {
              type: "text",
              text: "Please extract the full name, email address, and phone number from this resume. If any information is missing or uncertain, please indicate that in the response."
            }
          ],
        },
      ],
    });

    return object as z.infer<typeof resumeExtractionSchema>;
  } catch (error) {
    console.error("Failed to extract resume data:", error);
    throw new Error("AI resume extraction failed. Please try again.");
  }
};

const chatbotResponseSchema = z.object({
  message: z.string().describe("Friendly message to user"),
  extracted_data: z.object({
    email: z.string().describe("Email from user message or empty"),
    phone: z.string().describe("Phone from user message or empty")
  }),
  validation: z.object({
    email_valid: z.boolean(),
    phone_valid: z.boolean()
  }),
  is_complete: z.boolean().describe("True if all required fields collected"),
  next_field_needed: z.enum(["email", "phone", "none"])
});

export const processChatbotMessage = async (
  messages: Array<{ role: string; content: string }>,
  missingFields: string[],
  currentData: { name: string; email: string; phone: string }
) => {
  const { models } = await import("./ai-models.js");
  const model = models.gpt4omini || models.gpt4o || models.gemini25flashlite;

  if (!model) {
    throw new Error("No AI model available for chatbot.");
  }

  const allUserMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');

  const emailMatch = allUserMessages.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = allUserMessages.match(/[\d\s\-\+\(\)]{10,}/);

  const extractedEmail = emailMatch?.[0] || currentData.email;
  const extractedPhone = phoneMatch?.[0]?.replace(/\D/g, '') || currentData.phone;

  const emailValid = extractedEmail.includes('@') && extractedEmail.includes('.');
  const phoneValid = extractedPhone.length >= 10;

  const hasEmail = extractedEmail && emailValid;
  const hasPhone = extractedPhone && phoneValid;

  const isComplete = hasEmail && hasPhone;

  let nextField: "email" | "phone" | "none" = "none";
  let message = "";

  if (isComplete) {
    message = `Perfect! I have all your information:\n- Email: ${extractedEmail}\n- Phone: ${extractedPhone}\n\nYour resume verification is complete!`;
  } else if (!hasEmail) {
    nextField = "email";
    message = emailMatch ?
      "I see you provided an email, but it doesn't look valid. Could you please provide a valid email address?" :
      "Hi! I need to collect your email address. Could you please provide it?";
  } else if (!hasPhone) {
    nextField = "phone";
    message = phoneMatch ?
      "I see you provided a phone number, but it seems incomplete. Could you please provide a complete phone number?" :
      "Great! Now I need your phone number. Could you please provide it?";
  }

  return {
    message,
    extracted_data: {
      email: extractedEmail,
      phone: extractedPhone
    },
    validation: {
      email_valid: emailValid,
      phone_valid: phoneValid
    },
    is_complete: isComplete,
    next_field_needed: nextField
  };
};