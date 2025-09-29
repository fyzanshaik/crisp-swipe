import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { candidateQueries } from "@/lib/candidate-queries";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileText,
  Calendar,
  Clock,
  Target,
  Upload,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Play,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ResumeUploadFlow } from "@/components/candidate/ResumeUploadFlow";
import { ResultsDialog } from "@/components/candidate/ResultsDialog";

interface Interview {
  id: string;
  title: string;
  description: string | null;
  jobRole: string;
  deadline: string | null;
  isPublic: boolean | null;
  createdAt: string | null;
}

interface InterviewSession {
  id: string;
  interviewId?: string;
  status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
  startedAt: string | null;
  completedAt: string | null;
  interview?: {
    id: string;
    title: string;
    jobRole: string;
  };
}

interface Resume {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx";
  extractedName: string;
  extractedEmail: string;
  extractedPhone: string;
  uploadedAt: string | null;
  verifiedAt: string | null;
  verificationMethod: "ai_only" | "ai_plus_manual" | "manual_only";
  missingFields?: string[] | null;
}

interface QuestionSummary {
  type: "mcq" | "short_answer" | "code";
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number;
  points: number;
}

export const Route = createFileRoute("/_authenticated/candidate/dashboard")({
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return;
    }

    if (context.auth.user?.role !== "candidate") {
      throw redirect({
        to: "/_authenticated/recruiter/dashboard",
      });
    }
  },
  component: CandidateDashboard,
});

function CandidateDashboard() {
  const { user } = useAuth();
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUploadFlow, setShowUploadFlow] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery(
    candidateQueries.dashboard(),
  );
  const { data: resumesData, isLoading: isResumesLoading } = useQuery(
    candidateQueries.resumes(),
  );

  if (isDashboardLoading) {
    return <DashboardSkeleton />;
  }

  const availableInterviews = dashboardData?.availableInterviews || [];
  const mySessions = dashboardData?.mySessions || [];
  const resumes = resumesData?.resumes || [];

  const handleInterviewClick = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInterview(null);
  };

  const handleUploadSuccess = () => {
    setShowUploadFlow(false);
    setSelectedResume(null);
  };

  const handleViewResults = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowResultsDialog(true);
  };

  const handleCloseResults = () => {
    setShowResultsDialog(false);
    setSelectedSessionId(null);
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-sm text-muted-foreground">
            Manage interviews and track progress
          </p>
        </div>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{availableInterviews.length} available</span>
          <span>•</span>
          <span>{mySessions.length} sessions</span>
          <span>•</span>
          <span>{resumes.length} resumes</span>
        </div>
      </div>

      {/* Compact Tabs */}
      <Tabs defaultValue="interviews" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3 h-9">
          <TabsTrigger value="interviews" className="text-xs">
            Interviews
          </TabsTrigger>
          <TabsTrigger value="sessions" className="text-xs">
            Sessions
          </TabsTrigger>
          <TabsTrigger value="resumes" className="text-xs">
            Resumes
          </TabsTrigger>
        </TabsList>

        {/* Available Interviews Tab */}
        <TabsContent value="interviews" className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <h2 className="text-sm font-medium text-muted-foreground">
              Click to view details and start interview
            </h2>
            <Badge variant="outline" className="text-xs">
              {availableInterviews.length}
            </Badge>
          </div>

          {availableInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No interviews available
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Check back later for new interview opportunities
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {availableInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onClick={() => handleInterviewClick(interview)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">My Sessions</h2>
              <p className="text-sm text-muted-foreground">
                View your interview history and results
              </p>
            </div>
            <Badge variant="secondary">{mySessions.length} Sessions</Badge>
          </div>

          {mySessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Start your first interview to see your session history here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {mySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onViewResults={handleViewResults}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Resume Management Tab */}
        <TabsContent value="resumes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Resume Management</h2>
              <p className="text-sm text-muted-foreground">
                Upload and manage your resumes for interviews
              </p>
            </div>
            <Button onClick={() => setShowUploadFlow(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </div>

          {isResumesLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No resumes uploaded
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Upload your resume to start taking interviews
                </p>
                <Button onClick={() => setShowUploadFlow(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Resume
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onComplete={() => {
                    setSelectedResume(resume);
                    setShowUploadFlow(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Interview Details Modal */}
      <InterviewDetailsModal
        interview={selectedInterview}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      {/* Resume Upload Flow Modal */}
      {showUploadFlow && (
        <Dialog
          open={showUploadFlow}
          onOpenChange={(open) => {
            setShowUploadFlow(open);
            if (!open) setSelectedResume(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-foreground">
            <DialogHeader>
              <DialogTitle>Resume upload & verification</DialogTitle>
              <DialogDescription>
                Upload a resume or complete missing details to verify it.
              </DialogDescription>
            </DialogHeader>
            <ResumeUploadFlow
              mode="standalone"
              onSuccess={handleUploadSuccess}
              initialResume={selectedResume || undefined}
            />
          </DialogContent>
        </Dialog>
      )}

      <ResultsDialog
        sessionId={selectedSessionId}
        isOpen={showResultsDialog}
        onClose={handleCloseResults}
      />
    </div>
  );
}

function InterviewCard({
  interview,
  onClick,
}: {
  interview: Interview;
  onClick: () => void;
}) {
  const deadline = interview.deadline ? new Date(interview.deadline) : null;
  const isDeadlinePassed = deadline && deadline < new Date();

  return (
    <Card
      className="hover:shadow-sm transition-all cursor-pointer border-l-2 border-l-primary hover:border-l-primary/80"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{interview.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{interview.jobRole}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {interview.isPublic ? (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Assigned
              </Badge>
            )}
            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        {interview.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {interview.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isDeadlinePassed ? (
                <span className="text-destructive">Expired</span>
              ) : (
                deadline.toLocaleDateString()
              )}
            </div>
          )}
          <span>Click for details →</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionCard({
  session,
  onViewResults,
}: {
  session: InterviewSession;
  onViewResults: (sessionId: string) => void;
}) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 text-xs px-1.5 py-0"
          >
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0"
          >
            In Progress
          </Badge>
        );
      case "abandoned":
        return (
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            Abandoned
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {session.interview?.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{session.interview?.jobRole}</span>
            </div>
          </div>
          {getStatusBadge(session.status)}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {session.completedAt
              ? new Date(session.completedAt).toLocaleDateString()
              : session.startedAt
                ? new Date(session.startedAt).toLocaleDateString()
                : "Not started"}
          </div>

          <div className="flex gap-2">
            {session.status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onViewResults(session.id)}
              >
                View Results
              </Button>
            )}

            {session.status === "in_progress" && (
              <Link
                to="/candidate/interview-taking/$id"
                params={{ id: session.interviewId }}
              >
                <Button size="sm" className="h-7 text-xs">
                  Resume
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResumeCard({
  resume,
  onComplete,
}: {
  resume: Resume;
  onComplete: () => void;
}) {
  const isVerified =
    !!resume.verifiedAt &&
    (!resume.missingFields || resume.missingFields.length === 0);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{resume.fileName}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {resume.extractedName || "Name not extracted"}
              </span>
            </div>
          </div>
          {isVerified ? (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 text-xs px-1.5 py-0"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Incomplete
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground">
          <div className="truncate">
            <span className="font-medium">Email:</span>{" "}
            {resume.extractedEmail || "Missing"}
          </div>
          <div className="truncate">
            <span className="font-medium">Phone:</span>{" "}
            {resume.extractedPhone || "Missing"}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {resume.uploadedAt
              ? new Date(resume.uploadedAt).toLocaleDateString()
              : "Unknown date"}
          </div>

          {!isVerified &&
            resume.missingFields &&
            resume.missingFields.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onComplete}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function InterviewDetailsModal({
  interview,
  isOpen,
  onClose,
}: {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
}) {
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
          {/* Basic Info */}
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

          {/* Description */}
          {interview.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {interview.description}
              </p>
            </div>
          )}

          {/* Interview Details */}
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

          {/* Questions Breakdown */}
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

          {/* Actions */}
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
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>

      <div className="h-10 bg-muted rounded w-64"></div>

      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
