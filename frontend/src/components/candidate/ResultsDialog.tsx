import { useQuery } from "@tanstack/react-query";
import { candidateQueries } from "@/lib/candidate-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trophy, CheckCircle, XCircle } from "lucide-react";

interface ResultsDialogProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionResult {
  questionNumber: number;
  questionType: "mcq" | "short_answer" | "code" | undefined;
  difficulty: "easy" | "medium" | "hard" | undefined;
  questionText: string | undefined;
  yourAnswer: string;
  score: number | null;
  maxPoints: number | undefined;
  feedback: {
    total_score?: number;
    keyword_score?: number;
    semantic_score?: number;
    criteria_scores?: Record<string, number>;
    strengths?: string[];
    improvements?: string[];
    overall_feedback?: string;
  } | null;
  timeTaken: number | null;
}

export function ResultsDialog({ sessionId, isOpen, onClose }: ResultsDialogProps) {
  const { data: results, isLoading } = useQuery({
    ...candidateQueries.results(sessionId || ""),
    enabled: !!sessionId && isOpen,
  });

  if (!sessionId) return null;

  const isEvaluationInProgress = results && "message" in results;
  const hasResults = results && "summary" in results;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Interview Results
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isEvaluationInProgress ? (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-medium">{results.message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Progress: {results.evaluationProgress}
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated time: {results.estimatedTime}
              </p>
            </div>
          </div>
        ) : hasResults ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-primary">
                    {results.summary.totalScore} / {results.summary.maxScore}
                  </h2>
                  <p className="text-xl font-semibold">
                    {results.summary.percentage}%
                  </p>
                  <Badge
                    variant={
                      Number(results.summary.percentage) >= 70
                        ? "default"
                        : Number(results.summary.percentage) >= 50
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-sm"
                  >
                    {Number(results.summary.percentage) >= 70
                      ? "Excellent"
                      : Number(results.summary.percentage) >= 50
                        ? "Good"
                        : "Needs Improvement"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {results.summary.aiSummary && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    AI Assessment
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {results.summary.aiSummary}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold">Question-by-Question Results</h3>
              {results.results.map((result: QuestionResult, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            Question {result.questionNumber}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {result.questionType}
                          </Badge>
                          <Badge
                            variant={
                              result.difficulty === "easy"
                                ? "default"
                                : result.difficulty === "medium"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {result.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.questionText}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {result.score !== null && result.maxPoints && result.score >= result.maxPoints * 0.7 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-bold">
                          {result.score ?? 0} / {result.maxPoints ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Your Answer:
                        </p>
                        <div className="bg-muted p-3 rounded text-sm">
                          {result.yourAnswer || "No answer provided"}
                        </div>
                      </div>

                      {result.feedback?.overall_feedback && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Feedback:
                          </p>
                          <p className="text-sm">
                            {result.feedback.overall_feedback}
                          </p>
                        </div>
                      )}

                      {result.feedback?.strengths &&
                        result.feedback.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">
                              Strengths:
                            </p>
                            <ul className="text-sm space-y-1">
                              {result.feedback.strengths.map((strength: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {result.feedback?.improvements &&
                        result.feedback.improvements.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-orange-600 mb-1">
                              Areas for Improvement:
                            </p>
                            <ul className="text-sm space-y-1">
                              {result.feedback.improvements.map(
                                (improvement: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <XCircle className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                    <span>{improvement}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Time taken: {result.timeTaken ?? 0}s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No results found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}