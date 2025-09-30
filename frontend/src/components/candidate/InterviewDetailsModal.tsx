import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { candidateQueries } from "@/lib/candidate-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Clock, Play } from "lucide-react";

interface Interview {
  id: string;
  title: string;
  description: string | null;
  jobRole: string;
  deadline: string | null;
  isPublic: boolean | null;
}

interface QuestionSummary {
  type: "mcq" | "short_answer" | "code";
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  points: number;
}

interface InterviewDetailsModalProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InterviewDetailsModal = memo(function InterviewDetailsModal({
  interview,
  isOpen,
  onClose,
}: InterviewDetailsModalProps) {
  const { data: interviewDetails } = useQuery({
    ...candidateQueries.interviewDetails(interview?.id || ""),
    enabled: !!interview?.id && isOpen,
  });

  if (!interview) return null;

  const deadline = interview.deadline ? new Date(interview.deadline) : null;
  const isDeadlinePassed = deadline && deadline < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">{interview.title}</DialogTitle>
          <DialogDescription>
            Review the interview details and start when ready.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Job Role:</span>
              <span>{interview.jobRole}</span>
            </div>

            {deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Deadline:</span>
                <span className={isDeadlinePassed ? "text-destructive" : ""}>
                  {deadline.toLocaleDateString()}
                  {isDeadlinePassed && " (Expired)"}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-medium">Access:</span>
              {interview.isPublic ? (
                <Badge variant="outline">Public</Badge>
              ) : (
                <Badge variant="secondary">Assigned</Badge>
              )}
            </div>
          </div>

          {interview.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {interview.description}
              </p>
            </div>
          )}

          {interviewDetails && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {interviewDetails.interview.totalQuestions}
                </div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(interviewDetails.interview.totalTime / 60)}m
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {interviewDetails.interview.totalPoints}
                </div>
                <div className="text-xs text-muted-foreground">Points</div>
              </div>
            </div>
          )}

          {interviewDetails?.interview?.questionsSummary && (
            <div>
              <h4 className="font-medium mb-3">Questions Breakdown</h4>
              <div className="space-y-2">
                {interviewDetails.interview.questionsSummary.map(
                  (q: QuestionSummary, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {q.type.toUpperCase()}
                        </Badge>
                        <Badge
                          variant={
                            q.difficulty === "easy"
                              ? "default"
                              : q.difficulty === "medium"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {q.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {q.timeLimit}s
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {q.points} pts
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Link
              to="/candidate/interview-taking/$id"
              params={{ id: interview.id }}
              className="flex-1"
            >
              <Button className="w-full" disabled={!!isDeadlinePassed}>
                <Play className="h-4 w-4 mr-2" />
                {isDeadlinePassed ? "Deadline Passed" : "Start Interview"}
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});