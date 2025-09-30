import { pgTable, foreignKey, check, uuid, integer, varchar, jsonb, timestamp, unique, numeric, text, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const interviewQuestions = pgTable("interview_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interviewId: uuid("interview_id").notNull(),
	questionId: uuid("question_id").notNull(),
	orderIndex: integer("order_index").notNull(),
	points: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.interviewId],
			foreignColumns: [interviews.id],
			name: "interview_questions_interview_id_interviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "interview_questions_question_id_questions_id_fk"
		}).onDelete("cascade"),
	check("interview_questions_id_not_null", sql`NOT NULL id`),
	check("interview_questions_interview_id_not_null", sql`NOT NULL interview_id`),
	check("interview_questions_question_id_not_null", sql`NOT NULL question_id`),
	check("interview_questions_order_index_not_null", sql`NOT NULL order_index`),
	check("interview_questions_points_not_null", sql`NOT NULL points`),
]);

export const resumes = pgTable("resumes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	bucketKey: varchar("bucket_key", { length: 500 }).notNull(),
	fileName: varchar("file_name", { length: 255 }).notNull(),
	fileType: varchar("file_type", { length: 50 }).notNull(),
	fileSize: integer("file_size").notNull(),
	contentHash: varchar("content_hash", { length: 64 }),
	extractedName: varchar("extracted_name", { length: 255 }).notNull(),
	extractedEmail: varchar("extracted_email", { length: 255 }).notNull(),
	extractedPhone: varchar("extracted_phone", { length: 20 }).notNull(),
	verificationMethod: varchar("verification_method", { length: 50 }).notNull(),
	missingFields: jsonb("missing_fields"),
	retryCount: integer("retry_count").default(0),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow(),
	verifiedAt: timestamp("verified_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resumes_user_id_users_id_fk"
		}).onDelete("cascade"),
	check("resumes_id_not_null", sql`NOT NULL id`),
	check("resumes_user_id_not_null", sql`NOT NULL user_id`),
	check("resumes_bucket_key_not_null", sql`NOT NULL bucket_key`),
	check("resumes_file_name_not_null", sql`NOT NULL file_name`),
	check("resumes_file_type_not_null", sql`NOT NULL file_type`),
	check("resumes_file_size_not_null", sql`NOT NULL file_size`),
	check("resumes_extracted_name_not_null", sql`NOT NULL extracted_name`),
	check("resumes_extracted_email_not_null", sql`NOT NULL extracted_email`),
	check("resumes_extracted_phone_not_null", sql`NOT NULL extracted_phone`),
	check("resumes_verification_method_not_null", sql`NOT NULL verification_method`),
]);

export const interviewSessions = pgTable("interview_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	interviewId: uuid("interview_id").notNull(),
	userId: uuid("user_id").notNull(),
	resumeId: uuid("resume_id").notNull(),
	currentQuestionIndex: integer("current_question_index").default(0),
	status: varchar({ length: 50 }).default('not_started'),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	finalScore: integer("final_score"),
	maxScore: integer("max_score"),
	percentage: numeric({ precision: 5, scale:  2 }),
	aiSummary: text("ai_summary"),
	evaluatedAt: timestamp("evaluated_at", { mode: 'string' }),
	recruiterNotes: text("recruiter_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.interviewId],
			foreignColumns: [interviews.id],
			name: "interview_sessions_interview_id_interviews_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "interview_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.resumeId],
			foreignColumns: [resumes.id],
			name: "interview_sessions_resume_id_resumes_id_fk"
		}),
	unique("interview_sessions_session_token_unique").on(table.sessionToken),
	unique("interview_sessions_user_id_interview_id_unique").on(table.userId, table.interviewId),
	check("interview_sessions_id_not_null", sql`NOT NULL id`),
	check("interview_sessions_interview_id_not_null", sql`NOT NULL interview_id`),
	check("interview_sessions_user_id_not_null", sql`NOT NULL user_id`),
	check("interview_sessions_resume_id_not_null", sql`NOT NULL resume_id`),
	check("interview_sessions_session_token_not_null", sql`NOT NULL session_token`),
]);

export const answers = pgTable("answers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	questionId: uuid("question_id").notNull(),
	answerText: text("answer_text").notNull(),
	score: integer(),
	feedback: jsonb(),
	evaluated: boolean().default(false),
	evaluatedAt: timestamp("evaluated_at", { mode: 'string' }),
	aiModelUsed: varchar("ai_model_used", { length: 50 }),
	timeTaken: integer("time_taken"),
	submittedAt: timestamp("submitted_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [interviewSessions.id],
			name: "answers_session_id_interview_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "answers_question_id_questions_id_fk"
		}).onDelete("cascade"),
	unique("answers_session_id_question_id_unique").on(table.sessionId, table.questionId),
	check("answers_id_not_null", sql`NOT NULL id`),
	check("answers_session_id_not_null", sql`NOT NULL session_id`),
	check("answers_question_id_not_null", sql`NOT NULL question_id`),
	check("answers_answer_text_not_null", sql`NOT NULL answer_text`),
]);

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	difficulty: varchar({ length: 50 }).notNull(),
	category: varchar({ length: 100 }),
	questionText: text("question_text").notNull(),
	options: jsonb(),
	correctAnswer: text("correct_answer"),
	expectedKeywords: jsonb("expected_keywords"),
	minWords: integer("min_words"),
	maxWords: integer("max_words"),
	language: varchar({ length: 50 }),
	starterCode: text("starter_code"),
	sampleSolution: text("sample_solution"),
	evaluationCriteria: jsonb("evaluation_criteria"),
	timeLimit: integer("time_limit").notNull(),
	points: integer().notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "questions_created_by_users_id_fk"
		}),
	check("questions_id_not_null", sql`NOT NULL id`),
	check("questions_type_not_null", sql`NOT NULL type`),
	check("questions_difficulty_not_null", sql`NOT NULL difficulty`),
	check("questions_question_text_not_null", sql`NOT NULL question_text`),
	check("questions_time_limit_not_null", sql`NOT NULL time_limit`),
	check("questions_points_not_null", sql`NOT NULL points`),
]);

export const interviews = pgTable("interviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	jobRole: varchar("job_role", { length: 100 }).notNull(),
	isPublic: boolean("is_public").default(false),
	assignedEmails: jsonb("assigned_emails"),
	deadline: timestamp({ mode: 'string' }),
	status: varchar({ length: 50 }).default('draft'),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "interviews_created_by_users_id_fk"
		}),
	check("interviews_id_not_null", sql`NOT NULL id`),
	check("interviews_title_not_null", sql`NOT NULL title`),
	check("interviews_job_role_not_null", sql`NOT NULL job_role`),
	check("interviews_created_by_not_null", sql`NOT NULL created_by`),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	role: varchar({ length: 20 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	check("users_id_not_null", sql`NOT NULL id`),
	check("users_email_not_null", sql`NOT NULL email`),
	check("users_password_hash_not_null", sql`NOT NULL password_hash`),
	check("users_name_not_null", sql`NOT NULL name`),
	check("users_role_not_null", sql`NOT NULL role`),
]);
