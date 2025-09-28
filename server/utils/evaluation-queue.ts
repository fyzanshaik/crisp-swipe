interface EvaluationJob {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  questionType: 'mcq' | 'short_answer' | 'code';
  questionData: any;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

class EvaluationQueue {
  private queue: EvaluationJob[] = [];
  private processing = false;

  async addJob(jobData: {
    sessionId: string;
    questionId: string;
    answerText: string;
    questionType: 'mcq' | 'short_answer' | 'code';
    questionData: any;
  }): Promise<void> {
    const job: EvaluationJob = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      ...jobData,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    this.queue.push(job);
    console.log(`Added evaluation job ${job.id} for session ${job.sessionId}`);

    if (!this.processing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    console.log(`Starting evaluation queue processing. Queue size: ${this.queue.length}`);

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        console.log(`Processing evaluation job ${job.id} (attempt ${job.attempts + 1})`);
        await this.evaluateAnswer(job);
        console.log(`Successfully completed evaluation job ${job.id}`);
      } catch (error) {
        console.error(`Evaluation job ${job.id} failed:`, error);
        await this.handleJobError(job, error);
      }
    }

    this.processing = false;
    console.log('Evaluation queue processing completed');
  }

  private async evaluateAnswer(job: EvaluationJob): Promise<void> {
    const { evaluateMCQ, evaluateShortAnswer, evaluateCode } = await import('./evaluation');

    let result: { score: number; feedback: any };

    switch (job.questionType) {
      case 'mcq':
        result = await evaluateMCQ(job.questionData, job.answerText);
        break;
      case 'short_answer':
        result = await evaluateShortAnswer(job.questionData, job.answerText);
        break;
      case 'code':
        result = await evaluateCode(job.questionData, job.answerText);
        break;
      default:
        throw new Error(`Unknown question type: ${job.questionType}`);
    }

    const { db } = await import('../db/db');
    const { answers } = await import('../db/schema');
    const { eq, and } = await import('drizzle-orm');

    await db.update(answers)
      .set({
        score: result.score,
        feedback: result.feedback,
        evaluated: true,
        evaluatedAt: new Date(),
        aiModelUsed: job.questionType === 'mcq' ? null : 'gpt-4o-mini'
      })
      .where(
        and(
          eq(answers.sessionId, job.sessionId),
          eq(answers.questionId, job.questionId)
        )
      );

    await this.checkSessionCompletion(job.sessionId);
  }

  private async handleJobError(job: EvaluationJob, error: any): Promise<void> {
    job.attempts++;
    console.error(`Evaluation job ${job.id} failed (attempt ${job.attempts}):`, error);

    if (job.attempts < job.maxAttempts) {
      console.log(`Retrying evaluation job ${job.id} (attempt ${job.attempts + 1})`);
      setTimeout(() => {
        this.queue.push(job);
        if (!this.processing) {
          this.processQueue();
        }
      }, 2000);
    } else {
      console.error(`Evaluation job ${job.id} failed permanently after ${job.maxAttempts} attempts`);

      const { db } = await import('../db/db');
      const { answers } = await import('../db/schema');
      const { eq, and } = await import('drizzle-orm');

      await db.update(answers)
        .set({
          score: 0,
          feedback: {
            overall_feedback: `Evaluation failed: ${error.message || "Unknown error"}`,
            strengths: [],
            improvements: ["Manual review required due to evaluation failure"]
          },
          evaluated: true,
          evaluatedAt: new Date(),
          aiModelUsed: "failed"
        })
        .where(
          and(
            eq(answers.sessionId, job.sessionId),
            eq(answers.questionId, job.questionId)
          )
        );
    }
  }

  private async checkSessionCompletion(sessionId: string): Promise<void> {
    const { db } = await import('../db/db');
    const { interviewSessions } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, sessionId),
      with: {
        answers: true
      }
    });

    if (!session) return;

    const allEvaluated = session.answers.every(answer => answer.evaluated);

    if (allEvaluated && session.status === 'completed') {
      console.log(`All answers evaluated for session ${sessionId}. Generating final summary.`);
      const { generateFinalSummary } = await import('./evaluation');
      await generateFinalSummary(sessionId);
    }
  }

  getQueueStatus(): { queueSize: number; processing: boolean } {
    return {
      queueSize: this.queue.length,
      processing: this.processing
    };
  }
}

export const evaluationQueue = new EvaluationQueue();