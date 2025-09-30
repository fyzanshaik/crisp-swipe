import { relations } from "drizzle-orm/relations";
import { interviews, interviewQuestions, questions, users, resumes, interviewSessions, answers } from "./schema";

export const interviewQuestionsRelations = relations(interviewQuestions, ({one}) => ({
	interview: one(interviews, {
		fields: [interviewQuestions.interviewId],
		references: [interviews.id]
	}),
	question: one(questions, {
		fields: [interviewQuestions.questionId],
		references: [questions.id]
	}),
}));

export const interviewsRelations = relations(interviews, ({one, many}) => ({
	interviewQuestions: many(interviewQuestions),
	interviewSessions: many(interviewSessions),
	user: one(users, {
		fields: [interviews.createdBy],
		references: [users.id]
	}),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	interviewQuestions: many(interviewQuestions),
	answers: many(answers),
	user: one(users, {
		fields: [questions.createdBy],
		references: [users.id]
	}),
}));

export const resumesRelations = relations(resumes, ({one, many}) => ({
	user: one(users, {
		fields: [resumes.userId],
		references: [users.id]
	}),
	interviewSessions: many(interviewSessions),
}));

export const usersRelations = relations(users, ({many}) => ({
	resumes: many(resumes),
	interviewSessions: many(interviewSessions),
	questions: many(questions),
	interviews: many(interviews),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({one, many}) => ({
	interview: one(interviews, {
		fields: [interviewSessions.interviewId],
		references: [interviews.id]
	}),
	user: one(users, {
		fields: [interviewSessions.userId],
		references: [users.id]
	}),
	resume: one(resumes, {
		fields: [interviewSessions.resumeId],
		references: [resumes.id]
	}),
	answers: many(answers),
}));

export const answersRelations = relations(answers, ({one}) => ({
	interviewSession: one(interviewSessions, {
		fields: [answers.sessionId],
		references: [interviewSessions.id]
	}),
	question: one(questions, {
		fields: [answers.questionId],
		references: [questions.id]
	}),
}));