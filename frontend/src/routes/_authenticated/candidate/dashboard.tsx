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
import { FileText, Target, Upload } from "lucide-react";
import { useState, useCallback } from "react";
import { ResumeUploadFlow } from "@/components/candidate/ResumeUploadFlow";
import { ResultsDialog } from "@/components/candidate/ResultsDialog";
import { DashboardHeader } from "@/components/candidate/DashboardHeader";
import { InterviewCard } from "@/components/candidate/InterviewCard";
import { SessionCard } from "@/components/candidate/SessionCard";
import { ResumeCard } from "@/components/candidate/ResumeCard";
import { InterviewDetailsModal } from "@/components/candidate/InterviewDetailsModal";

interface Interview {
  id: string;
  title: string;
  description: string | null;
  jobRole: string;
  deadline: string | null;
  isPublic: boolean | null;
  createdAt: string | null;
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

  const handleInterviewClick = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedInterview(null);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setShowUploadFlow(false);
    setSelectedResume(null);
  }, []);

  const handleViewResults = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowResultsDialog(true);
  }, []);

  const handleCloseResults = useCallback(() => {
    setShowResultsDialog(false);
    setSelectedSessionId(null);
  }, []);

  const handleResumeComplete = useCallback((resume: Resume) => {
    setSelectedResume(resume);
    setShowUploadFlow(true);
  }, []);

  if (isDashboardLoading) {
    return <DashboardSkeleton />;
  }

  const availableInterviews = dashboardData?.availableInterviews || [];
  const mySessions = dashboardData?.mySessions || [];
  const resumes = resumesData?.resumes || [];

  return (
    <div className="space-y-4">
      <DashboardHeader
        userName={user?.name || "User"}
        availableCount={availableInterviews.length}
        sessionsCount={mySessions.length}
        resumesCount={resumes.length}
      />

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

        <TabsContent value="sessions" className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <h2 className="text-sm font-medium text-muted-foreground">
              Track your interview progress and view results
            </h2>
            <Badge variant="outline" className="text-xs">
              {mySessions.length}
            </Badge>
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
            <div className="grid gap-3">
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
                  onComplete={() => handleResumeComplete(resume)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <InterviewDetailsModal
        interview={selectedInterview}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

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
