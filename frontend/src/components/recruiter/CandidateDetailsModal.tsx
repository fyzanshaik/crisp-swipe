import { memo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruiterApi } from "@/lib/recruiter-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Save,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface CandidateDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
}

export const CandidateDetailsModal = memo(function CandidateDetailsModal({
  open,
  onOpenChange,
  sessionId,
}: CandidateDetailsModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const { data: candidateData, isLoading } = useQuery({
    queryKey: ["recruiter", "candidate", sessionId],
    queryFn: () => recruiterApi.getCandidate(sessionId!),
    enabled: !!sessionId && open,
  });

  const candidate = candidateData?.candidate;

  useEffect(() => {
    if (candidate?.recruiterNotes) {
      setNotes(candidate.recruiterNotes);
    }
  }, [candidate?.recruiterNotes]);

  const updateNotesMutation = useMutation({
    mutationFn: (newNotes: string) => recruiterApi.updateCandidateNotes(sessionId!, newNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "candidate", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["recruiter", "candidates"] });
      toast.success("Notes updated successfully");
      setIsEditingNotes(false);
    },
    onError: () => {
      toast.error("Failed to update notes");
    },
  });


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

  const getPerformanceConfig = (percentage: number) => {
    if (percentage >= 80) {
      return { label: "Outstanding", color: "text-green-600", bgColor: "bg-green-500/10", icon: Trophy };
    } else if (percentage >= 60) {
      return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-500/10", icon: Target };
    } else if (percentage >= 40) {
      return { label: "Average", color: "text-yellow-600", bgColor: "bg-yellow-500/10", icon: Award };
    } else {
      return { label: "Needs Improvement", color: "text-red-600", bgColor: "bg-red-500/10", icon: TrendingDown };
    }
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(notes);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[92vw] max-h-[92vh] p-0 gap-0">
        <div className="px-6 py-4 border-b bg-gradient-to-br from-primary/5 to-transparent">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              Candidate Performance Details
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(92vh - 80px)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading candidate details...</p>
              </div>
            </div>
          ) : !candidate ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Candidate not found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Candidate Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{candidate.user?.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{candidate.user?.email || "N/A"}</span>
                      </div>
                      {candidate.resume?.extractedPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{candidate.resume.extractedPhone}</span>
                        </div>
                      )}
                      {candidate.resume?.fileName && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate">{candidate.resume.fileName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Overall Performance
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 rounded-lg bg-primary/5">
                        <div className="text-2xl font-bold text-primary">{candidate.finalScore}</div>
                        <p className="text-xs text-muted-foreground">Total Score</p>
                        <p className="text-[10px] text-muted-foreground">out of {candidate.maxScore}</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-primary/5">
                        <div className="text-2xl font-bold text-primary">{candidate.percentage}%</div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      {(() => {
                        const config = getPerformanceConfig(Number(candidate.percentage) || 0);
                        const PerformanceIcon = config.icon;
                        return (
                          <Badge className={`border ${config.bgColor} ${config.color} text-xs px-3 py-1`}>
                            <PerformanceIcon className="h-3.5 w-3.5 mr-1" />
                            {config.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {candidate.aiSummary && (
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
                        <p className="text-sm leading-relaxed">{candidate.aiSummary}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Recruiter Notes
                    </h3>
                    {!isEditingNotes ? (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(true)}>
                        Edit Notes
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNotes(candidate.recruiterNotes || "");
                            setIsEditingNotes(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={updateNotesMutation.isPending}
                        >
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this candidate..."
                      className="min-h-[100px] text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {candidate.recruiterNotes || "No notes added yet. Click 'Edit Notes' to add."}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Question-by-Question Breakdown</h3>
                </div>

                <Accordion type="multiple" className="space-y-2.5">
                  {candidate.answers?.map((answerItem: unknown, index: number) => {
                    const answer = answerItem as {
                      id: string;
                      score: number | null;
                      answer: string;
                      timeTaken: number | null;
                      question?: {
                        points?: number;
                        type?: string;
                        difficulty?: string;
                        questionText?: string;
                      };
                      feedback?: {
                        overall_feedback?: string;
                        strengths?: string[];
                        improvements?: string[];
                      };
                    };

                    const scorePercentage = answer.score && answer.question?.points
                      ? (answer.score / answer.question.points) * 100
                      : 0;
                    const isPassing = scorePercentage >= 70;

                    return (
                      <AccordionItem
                        key={answer.id}
                        value={`question-${index}`}
                        className="border-2 rounded-lg px-5 bg-card"
                      >
                        <AccordionTrigger className="hover:no-underline py-3.5">
                          <div className="flex items-center justify-between gap-4 w-full pr-3">
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                                  Q{index + 1}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                                  {getTypeLabel(answer.question?.type)}
                                </Badge>
                                <Badge className={`border text-[10px] px-1.5 py-0.5 ${getDifficultyColor(answer.question?.difficulty)}`}>
                                  {answer.question?.difficulty?.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm line-clamp-1">{answer.question?.questionText}</p>
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
                                <div className="text-lg font-bold">{answer.score ?? 0}</div>
                                <div className="text-xs text-muted-foreground">/ {answer.question?.points ?? 0}</div>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="pb-5 pt-1">
                          <div className="space-y-3.5">
                            <div>
                              <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                                <div className="w-1 h-4 bg-primary rounded-full"></div>
                                Candidate's Answer
                              </p>
                              <div className="bg-muted/50 p-3 rounded-lg border ml-2.5">
                                <p className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                  {answer.answer || "No answer provided"}
                                </p>
                              </div>
                            </div>

                            {answer.feedback?.overall_feedback && (
                              <div>
                                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-muted-foreground">
                                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                                  AI Feedback
                                </p>
                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 ml-2.5">
                                  <p className="text-xs leading-relaxed">{answer.feedback.overall_feedback}</p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              {answer.feedback?.strengths && answer.feedback.strengths.length > 0 && (
                                <div className="bg-green-500/5 p-3 rounded-lg border border-green-500/20">
                                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-green-600">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Strengths
                                  </p>
                                  <ul className="space-y-1.5">
                                    {answer.feedback.strengths.map((strength: string, i: number) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs">
                                        <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="leading-relaxed">{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {answer.feedback?.improvements && answer.feedback.improvements.length > 0 && (
                                <div className="bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-orange-600">
                                    <TrendingDown className="h-3.5 w-3.5" />
                                    Areas for Improvement
                                  </p>
                                  <ul className="space-y-1.5">
                                    {answer.feedback.improvements.map((improvement: string, i: number) => (
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
                              <span>Time taken: {answer.timeTaken ?? 0} seconds</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});