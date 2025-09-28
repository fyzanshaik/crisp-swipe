CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	"score" integer,
	"feedback" jsonb,
	"evaluated" boolean DEFAULT false,
	"evaluated_at" timestamp,
	"ai_model_used" varchar(50),
	"time_taken" integer,
	"submitted_at" timestamp DEFAULT now(),
	CONSTRAINT "answers_session_id_question_id_unique" UNIQUE("session_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "interview_questions_interview_id_question_id_unique" UNIQUE("interview_id","question_id"),
	CONSTRAINT "interview_questions_interview_id_order_index_unique" UNIQUE("interview_id","order_index")
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"current_question_index" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'not_started',
	"session_token" varchar(255) NOT NULL,
	"locked_until" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"final_score" integer,
	"max_score" integer,
	"percentage" numeric(5, 2),
	"ai_summary" text,
	"evaluated_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "interview_sessions_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "interview_sessions_user_id_interview_id_unique" UNIQUE("user_id","interview_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"job_role" varchar(100) NOT NULL,
	"is_public" boolean DEFAULT false,
	"assigned_emails" jsonb,
	"deadline" timestamp,
	"status" varchar(50) DEFAULT 'draft',
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"difficulty" varchar(50) NOT NULL,
	"category" varchar(100),
	"question_text" text NOT NULL,
	"options" jsonb,
	"correct_answer" text,
	"expected_keywords" jsonb,
	"min_words" integer,
	"max_words" integer,
	"language" varchar(50),
	"starter_code" text,
	"sample_solution" text,
	"evaluation_criteria" jsonb,
	"time_limit" integer NOT NULL,
	"points" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bucket_key" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" integer NOT NULL,
	"extracted_name" varchar(255) NOT NULL,
	"extracted_email" varchar(255) NOT NULL,
	"extracted_phone" varchar(20) NOT NULL,
	"verification_method" varchar(50) NOT NULL,
	"missing_fields" jsonb,
	"retry_count" integer DEFAULT 0,
	"uploaded_at" timestamp DEFAULT now(),
	"verified_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"role" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;