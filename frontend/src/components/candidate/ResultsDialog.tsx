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
import { Loader2, Trophy, CheckCircle, XCircle, TrendingUp, TrendingDown, Clock, Target, Sparkles, Award } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

  const getPerformanceConfig = (percentage: number) => {
    if (percentage >= 80) {
      return {
        label: "Outstanding",
        color: "text-green-600",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/50",
        icon: Trophy,
      };
    } else if (percentage >= 70) {
      return {
        label: "Excellent",
        color: "text-blue-600",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/50",
        icon: TrendingUp,
      };
    } else if (percentage >= 50) {
      return {
        label: "Good",
        color: "text-yellow-600",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/50",
        icon: Target,
      };
    } else {
      return {
        label: "Needs Improvement",
        color: "text-red-600",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/50",
        icon: TrendingDown,
      };
    }
  };

  const getDifficultyColor = (difficulty: string | undefined) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-600 border-green-500/50";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/50";
      case "hard":
        return "bg-red-500/10 text-red-600 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeLabel = (type: string | undefined) => {
    switch (type) {
      case "mcq":
        return "Multiple Choice";
      case "short_answer":
        return "Short Answer";
      case "code":
        return "Coding";
      default:
        return type || "Unknown";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] w-[92vw] max-h-[92vh] p-0 gap-0">
        <div className="px-6 py-4 border-b bg-gradient-to-br from-primary/5 to-transparent">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              Interview Results
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(92vh - 80px)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading results...</p>
              </div>
            </div>
          ) : isEvaluationInProgress ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">{results.message}</p>
                <p className="text-sm text-muted-foreground">
                  Progress: {results.evaluationProgress}
                </p>
                <p className="text-sm text-muted-foreground">
                  Estimated time: {results.estimatedTime}
                </p>
              </div>
            </div>
          ) : hasResults ? (
            <div className="space-y-4">
              <Card className="border-2">
                <CardContent className="p-5">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-primary/5">
                      <Award className="h-5 w-5 text-primary mb-1.5" />
                      <div className="text-2xl font-bold text-primary mb-0.5">
                        {results.summary.totalScore}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Score</p>
                      <p className="text-[10px] text-muted-foreground">
                        out of {results.summary.maxScore}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-primary/5">
                      <Target className="h-5 w-5 text-primary mb-1.5" />
                      <div className="text-2xl font-bold text-primary mb-0.5">
                        {results.summary.percentage}%
                      </div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-primary/5">
                      <Trophy className="h-5 w-5 text-primary mb-1.5" />
                      <div className="text-2xl font-bold text-primary mb-0.5">
                        {results.results.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                      {(() => {
                        const config = getPerformanceConfig(Number(results.summary.percentage));
                        const PerformanceIcon = config.icon;
                        return (
                          <>
                            <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center mb-1.5`}>
                              <PerformanceIcon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <Badge
                              className={`border ${config.bgColor} ${config.color} ${config.borderColor} text-xs px-2 py-0.5`}
                            >
                              {config.label}
                            </Badge>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {results.summary.aiSummary && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="ai-summary" className="border-2 rounded-lg px-5 bg-card">
                    <AccordionTrigger className="hover:no-underline py-3.5">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">AI Performance Summary</h3>
                          <p className="text-xs text-muted-foreground">Click to expand</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-1">
                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <p className="text-sm leading-relaxed">
                          {results.summary.aiSummary}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Question-by-Question Breakdown</h3>
                </div>

                <Accordion type="multiple" className="space-y-2.5">
                  {results.results.map((result: QuestionResult, index: number) => {
                    const scorePercentage = result.score && result.maxPoints
                      ? (result.score / result.maxPoints) * 100
                      : 0;
                    const isPassing = scorePercentage >= 70;

                    return (
                      <AccordionItem
                        key={index}
                        value={`question-${index}`}
                        className="border-2 rounded-lg px-5 bg-card"
                      >
                        <AccordionTrigger className="hover:no-underline py-3.5">
                          <div className="flex items-center justify-between gap-4 w-full pr-3">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                                  Q{result.questionNumber}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                  {getTypeLabel(result.questionType)}
                                </Badge>
                                <Badge className={`border text-[10px] px-1.5 py-0.5 ${getDifficultyColor(result.difficulty)}`}>
                                  {result.difficulty?.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm line-clamp-1">
                                {result.questionText}
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                              <div className={`w-9 h-9 rounded-full ${isPassing ? "bg-green-500/10" : "bg-red-500/10"} flex items-center justify-center`}>
                                {isPassing ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {result.score ?? 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  / {result.maxPoints ?? 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="pb-5 pt-1">
                          <div className="space-y-3.5">
                            <div>
                              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                                <div className="w-1 h-4 bg-primary rounded-full"></div>
                                Your Answer
                              </p>
                              <div className="bg-muted/50 p-3 rounded-lg border ml-2.5">
                                <p className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                  {result.yourAnswer || "No answer provided"}
                                </p>
                              </div>
                            </div>

                            {result.feedback?.overall_feedback && (
                              <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                                  Overall Feedback
                                </p>
                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 ml-2.5">
                                  <p className="text-xs leading-relaxed">
                                    {result.feedback.overall_feedback}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {result.feedback?.strengths && result.feedback.strengths.length > 0 && (
                                <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/20">
                                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-green-600">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Strengths
                                  </p>
                                  <ul className="space-y-1.5">
                                    {result.feedback.strengths.map((strength: string, i: number) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {result.feedback?.improvements && result.feedback.improvements.length > 0 && (
                                <div className="bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-orange-600">
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    Areas for Improvement
                                  </p>
                                  <ul className="space-y-1.5">
                                    {result.feedback.improvements.map((improvement: string, i: number) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs">
                                        <XCircle className="h-3.5 w-3.5 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{improvement}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Time taken: {result.timeTaken ?? 0} seconds</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm text-muted-foreground">
                Results may still be processing. Please check back later.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}