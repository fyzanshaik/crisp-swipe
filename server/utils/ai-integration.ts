import { z } from 'zod';
import { generateObject } from 'ai';
import { generateObjectWithModel, getDefaultModel } from './ai-models.js';
import { createQuestionSchema, chatbotResponseSchema } from './validation.js';
import { GENERATE_QUESTIONS_PROMPT, GENERATE_QUESTIONS_SYSTEM, REGENERATE_QUESTION_PROMPT, REGENERATE_QUESTION_SYSTEM, CHATBOT_SYSTEM_PROMPT, CHATBOT_USER_PROMPT } from './prompts.js';

const generateAllQuestionsSchema = z.object({
	questions: z.array(createQuestionSchema),
});

const regenerateQuestionSchema = z.object({
	question: createQuestionSchema,
});

const resumeExtractionSchema = z
	.object({
		isValidResume: z.boolean().describe('Whether this document is a valid resume/CV'),
		documentType: z.enum(['resume', 'cv', 'other_document', 'invalid']).describe('Type of document detected'),
		invalidReason: z.string().optional().describe('Reason why document is invalid (if isValidResume is false)'),
		name: z.string().describe('Full name of the person from the resume, empty string if not found'),
		email: z.string().describe('Email address from the resume, empty string if not found'),
		phone: z.string().describe('Phone number from the resume, empty string if not found'),
		confidence: z
			.object({
				name: z.number().min(0).max(1).describe('Confidence level for name extraction (0-1)'),
				email: z.number().min(0).max(1).describe('Confidence level for email extraction (0-1)'),
				phone: z.number().min(0).max(1).describe('Confidence level for phone extraction (0-1)'),
			})
			.describe('Confidence scores for each extracted field'),
		missing_fields: z.array(z.enum(['name', 'email', 'phone'])).describe('List of fields that could not be extracted or have low confidence'),
	})
	.describe('Extracted personal information from resume');

export const generateAllQuestions = async (jobRole: string, technologies: string[], customPrompt?: string) => {
	const model = getDefaultModel();
	const prompt = GENERATE_QUESTIONS_PROMPT(jobRole, technologies, customPrompt);

	try {
		const result = await generateObjectWithModel(prompt, generateAllQuestionsSchema, model, GENERATE_QUESTIONS_SYSTEM);

		return (result as z.infer<typeof generateAllQuestionsSchema>).questions;
	} catch (error) {
		console.error('Failed to generate questions:', error);
		throw new Error('AI question generation failed. Please try again.');
	}
};

export const regenerateQuestion = async (_questionId: string, modificationRequest: string, currentQuestion?: any) => {
	const model = getDefaultModel();
	const prompt = REGENERATE_QUESTION_PROMPT(modificationRequest, currentQuestion);

	try {
		const result = await generateObjectWithModel(prompt, regenerateQuestionSchema, model, REGENERATE_QUESTION_SYSTEM);

		return (result as z.infer<typeof regenerateQuestionSchema>).question;
	} catch (error) {
		console.error('Failed to regenerate question:', error);
		throw new Error('AI question regeneration failed. Please try again.');
	}
};

export const extractResumeData = async (fileData: ArrayBuffer, mimeType: string) => {
	const { extractTextFromFile } = await import('./text-extraction.js');
	const { models } = await import('./ai-models.js');
	const model = models.gpt4omini || models.gpt4o || models.gemini25flashlite || models.gemini25flash;

	if (!model) {
		throw new Error('No AI model available for resume processing.');
	}

	try {
		const extractedText = await extractTextFromFile(fileData, mimeType);

		if (!extractedText || extractedText.length < 50) {
			throw new Error('Document appears to be empty or too short to be a valid resume.');
		}

		const { object } = await generateObject({
			model,
			schema: resumeExtractionSchema,
			system:
				'You are an expert at validating and extracting information from resumes. A valid resume/CV must contain professional information like work experience, education, or skills. Contact details (name, email, phone) are NOT required for validation - we can collect those separately. Mark isValidResume as false ONLY if the document is clearly not a resume (e.g., receipt, article, random text).',
			prompt: `Analyze this document:\n\n${extractedText.slice(
				0,
				4000
			)}\n\nIs this a valid resume/CV based on professional content? Extract name, email, and phone if available (they may be missing).`,
		});

		return object as z.infer<typeof resumeExtractionSchema>;
	} catch (error) {
		console.error('Failed to extract resume data:', error);
		throw new Error('AI resume extraction failed. Please try again.');
	}
};

export const processChatbotMessage = async (messages: Array<{ role: string; content: string }>, missingFields: string[], currentData: { name: string; email: string; phone: string }) => {
	const { models } = await import('./ai-models.js');
	const model = models.gpt4omini || models.gpt4o || models.gemini25flashlite;

	if (!model) {
		throw new Error('No AI model available for chatbot.');
	}

	const allUserMessages = messages
		.filter((m) => m.role === 'user')
		.map((m) => m.content)
		.join(' ');

	const emailMatch = allUserMessages.match(/[\w.-]+@[\w.-]+\.\w+/);
	const phoneMatch = allUserMessages.match(/[\d\s\-\+\(\)]{10,}/);
	const regexEmail = emailMatch?.[0] || currentData.email;
	const regexPhone = phoneMatch?.[0]?.replace(/\D/g, '') || currentData.phone;

	try {
		const conversationHistory = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

		const systemPrompt = CHATBOT_SYSTEM_PROMPT(currentData, missingFields);
		const userPrompt = CHATBOT_USER_PROMPT(conversationHistory);

		const { object } = await generateObject({
			model,
			schema: chatbotResponseSchema,
			system: systemPrompt,
			prompt: userPrompt,
		});

		const aiResponse = object as z.infer<typeof chatbotResponseSchema>;

		const extractedEmail = aiResponse.extracted_data.email || regexEmail;
		const extractedPhone = aiResponse.extracted_data.phone || regexPhone;

		return {
			message: aiResponse.message,
			extracted_data: {
				email: extractedEmail,
				phone: extractedPhone,
			},
			validation: aiResponse.validation,
			is_complete: aiResponse.is_complete,
			next_field_needed: aiResponse.next_field_needed,
		};
	} catch (error) {
		console.error('AI chatbot processing failed, falling back to regex:', error);

		const emailValid = regexEmail.includes('@') && regexEmail.includes('.');
		const phoneValid = regexPhone.length >= 10;

		const hasEmail = regexEmail && emailValid;
		const hasPhone = regexPhone && phoneValid;

		const isComplete = hasEmail && hasPhone;

		let nextField: 'email' | 'phone' | 'none' = 'none';
		let message = '';

		if (isComplete) {
			message = `Perfect! I have all your information:\n- Email: ${regexEmail}\n- Phone: ${regexPhone}\n\nYour resume verification is complete!`;
		} else if (!hasEmail) {
			nextField = 'email';
			message = emailMatch
				? "I see you provided an email, but it doesn't look valid. Could you please provide a valid email address?"
				: 'Hi! I need to collect your email address. Could you please provide it?';
		} else if (!hasPhone) {
			nextField = 'phone';
			message = phoneMatch
				? 'I see you provided a phone number, but it seems incomplete. Could you please provide a complete phone number?'
				: 'Great! Now I need your phone number. Could you please provide it?';
		}

		return {
			message,
			extracted_data: {
				email: regexEmail,
				phone: regexPhone,
			},
			validation: {
				email_valid: emailValid,
				phone_valid: phoneValid,
			},
			is_complete: isComplete,
			next_field_needed: nextField,
		};
	}
};
