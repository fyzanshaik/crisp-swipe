import { generateObject, generateText } from "ai";
import { z } from "zod";

export async function evaluateMCQ(question: any, answer: string): Promise<{ score: number; feedback: any }> {
  const isCorrect = answer.trim() === question.correctAnswer?.trim();
  const score = isCorrect ? question.points : 0;

  const feedback = {
    total_score: score,
    overall_feedback: isCorrect
      ? "Correct!"
      : `Incorrect. The correct answer is: ${question.correctAnswer}`,
    strengths: isCorrect ? ["Correct answer selected"] : [],
    improvements: isCorrect ? [] : ["Review the concept and try again"]
  };

  return { score, feedback };
}

export async function evaluateShortAnswer(question: any, answer: string): Promise<{ score: number; feedback: any }> {
  const keywords = question.expectedKeywords || [];

  const keywordsFound = keywords.filter((keyword: string) =>
    answer.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  const keywordScore = (keywordsFound / keywords.length) * (question.points * 0.5);

  const { getDefaultModel } = await import('./ai-models');
  const model = getDefaultModel();

  const aiEvalSchema = z.object({
    semantic_score: z.number().min(0).max(question.points * 0.5),
    feedback: z.string(),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
  });

  let aiEval;
  try {
    aiEval = await generateObject({
      model,
      schema: aiEvalSchema,
      prompt: `
        Evaluate this short answer question response:

        Question: ${question.questionText}
        Answer: ${answer}
        Expected keywords: ${keywords.join(", ")}

        Score the answer based on technical accuracy and depth.
        Maximum semantic score: ${question.points * 0.5} points.

        Provide constructive feedback, strengths, and areas for improvement.

        Respond with a JSON object containing:
        - semantic_score: number between 0 and ${question.points * 0.5}
        - feedback: string
        - strengths: array of strings
        - improvements: array of strings
      `,
    });
  } catch (error) {
    console.error('AI evaluation failed for short answer:', error);
    aiEval = {
      object: {
        semantic_score: 0,
        feedback: "AI evaluation failed, manual review needed",
        strengths: [],
        improvements: ["Please review this answer manually"]
      }
    };
  }

  const totalScore = Math.min(question.points, keywordScore + aiEval.object.semantic_score);

  const feedback = {
    total_score: totalScore,
    keyword_score: keywordScore,
    semantic_score: aiEval.object.semantic_score,
    overall_feedback: aiEval.object.feedback,
    strengths: aiEval.object.strengths,
    improvements: aiEval.object.improvements,
  };

  return { score: Math.round(totalScore), feedback };
}

export async function evaluateCode(question: any, answer: string): Promise<{ score: number; feedback: any }> {
  const { getDefaultModel } = await import('./ai-models');
  const model = getDefaultModel();

  const codeEvalSchema = z.object({
    score: z.number().min(0).max(question.points),
    criteria_scores: z.record(z.string(), z.number()),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    overall_feedback: z.string(),
    code_quality: z.enum(['excellent', 'good', 'fair', 'poor']),
    completeness: z.enum(['complete', 'mostly_complete', 'partial', 'incomplete']),
  });

  let aiEval;
  try {
    aiEval = await generateObject({
      model,
      schema: codeEvalSchema,
      prompt: `
        You are evaluating a coding interview answer. Be fair but rigorous.

        Question: ${question.questionText}

        Expected solution approach:
        ${question.sampleSolution || 'No sample solution provided'}

        Evaluation criteria:
        ${question.evaluationCriteria?.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n') || 'General code quality and correctness'}

        Candidate's code:
        ${answer}

        Evaluate the code on:
        - Correctness and logic
        - Code quality and structure
        - Error handling
        - TypeScript usage (if applicable)
        - Best practices

        Award partial credit for correct concepts even if implementation is incomplete.
        Maximum score: ${question.points} points

        Respond with a JSON object containing:
        - score: number between 0 and ${question.points}
        - criteria_scores: object with criterion names as keys and scores as values
        - strengths: array of strings
        - improvements: array of strings
        - overall_feedback: string
        - code_quality: one of "excellent", "good", "fair", "poor"
        - completeness: one of "complete", "mostly_complete", "partial", "incomplete"
      `,
    });
  } catch (error) {
    console.error('AI evaluation failed for code:', error);
    aiEval = {
      object: {
        score: Math.floor(question.points * 0.3), // Give 30% partial credit on AI failure
        criteria_scores: {},
        strengths: [],
        improvements: ["Please review this code manually"],
        overall_feedback: "AI evaluation failed, manual review needed",
        code_quality: 'fair' as const,
        completeness: 'partial' as const,
      }
    };
  }

  const feedback = {
    total_score: aiEval.object.score,
    criteria_scores: aiEval.object.criteria_scores,
    strengths: aiEval.object.strengths,
    improvements: aiEval.object.improvements,
    overall_feedback: aiEval.object.overall_feedback,
  };

  return { score: Math.round(aiEval.object.score), feedback };
}

export async function generateFinalSummary(sessionId: string): Promise<void> {
  const { db } = await import('../db/db');
  const { interviewSessions } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  const session = await db.query.interviewSessions.findFirst({
    where: eq(interviewSessions.id, sessionId),
    with: {
      answers: {
        with: {
          question: true
        }
      },
      user: true,
      interview: true,
    },
  });

  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const totalScore = session.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
  const maxScore = session.answers.reduce((sum, answer) => sum + (answer.question?.points || 0), 0);
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const { getDefaultModel } = await import('./ai-models');
  const model = getDefaultModel();

  const summary = await generateText({
    model,
    prompt: `
      Generate a comprehensive interview summary for a candidate.

      Candidate: ${session.user?.name}
      Position: ${session.interview?.title}
      Job Role: ${session.interview?.jobRole}
      Total Score: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)

      Performance breakdown:
      ${session.answers
        .map(
          (answer) => `
        Question: ${answer.question?.questionText}
        Type: ${answer.question?.type} (${answer.question?.difficulty})
        Score: ${answer.score || 0}/${answer.question?.points || 0}
        Time taken: ${answer.timeTaken || 0}s
      `
        )
        .join('\n')}

      Please generate a professional 4-5 sentence summary covering:
      1. Overall technical competency level for the role
      2. Key strengths demonstrated in the responses
      3. Areas that need improvement
      4. Hiring recommendation: Strong Hire / Hire / Maybe / No Hire

      Be objective, constructive, and specific. Base your assessment on the actual performance data.
    `,
  });

  await db
    .update(interviewSessions)
    .set({
      finalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage.toString(),
      aiSummary: summary.text,
      evaluatedAt: new Date(),
    })
    .where(eq(interviewSessions.id, sessionId));

  console.log(`Final summary generated for session ${sessionId}: ${totalScore}/${maxScore} (${percentage.toFixed(1)}%)`);
}