import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { candidateQueries } from "@/lib/candidate-queries";
import { useInterviewStore } from "@/stores/interview-store";
import { SimpleResumeSelector } from "@/components/candidate/SimpleResumeSelector";
import { ReadyToStartStep } from "@/components/candidate/ReadyToStartStep";
import { InterviewQuestionsFlow } from "@/components/candidate/InterviewQuestionsFlow";
import { useEffect } from "react";

type ResumeCheckResponse =
  | {
      message: string;
      sessionStatus: string;
      sessionId: string;
      canResume: true;
    }
  | {
      interview: {
        id: string;
        title: string;
      };
      canStart: boolean;
      verifiedResumes: Array<{
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
      }>;
      incompleteResumes: Array<{
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
      }>;
      requiresUpload: boolean;
    };

export const Route = createFileRoute("/_authenticated/candidate/interview-taking/$id")({
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
  component: InterviewTakingPage,
});

function InterviewTakingPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { currentStep, setCurrentStep, resetState } = useInterviewStore();

  const { data: activeSession, isLoading: isActiveLoading } = useQuery({
    ...candidateQueries.activeSession(),
    enabled: currentStep === 'resume-check',
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const { data: resumeCheck, isLoading: isResumeLoading } = useQuery({
    ...candidateQueries.resumeCheck(id),
    enabled: currentStep === 'resume-check' && !activeSession?.activeSession,
  });

  const { data: interviewDetails } = useQuery({
    ...candidateQueries.interviewDetails(id),
    enabled: currentStep === 'ready',
  });

  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  useEffect(() => {
    if (activeSession?.activeSession && currentStep === 'resume-check') {
      setCurrentStep('questions');
    }
  }, [activeSession, currentStep, setCurrentStep]);

  if (isActiveLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {currentStep === 'resume-check' ? 'Resume Verification' :
           currentStep === 'ready' ? 'Interview Setup' :
           currentStep === 'questions' ? 'Interview in Progress' :
           'Interview Complete'}
        </h1>
        <p className="text-muted-foreground">
          {currentStep === 'resume-check' ? 'Please verify your resume to continue' :
           currentStep === 'ready' ? 'Get ready to start your interview' :
           currentStep === 'questions' ? `Welcome ${user?.name}` :
           'Thank you for completing the interview'}
        </p>
      </div>

      {currentStep === 'resume-check' && (
        <>
          {isResumeLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading resume options...</p>
              </div>
            </div>
          ) : resumeCheck ? (
            <SimpleResumeSelector
              data={resumeCheck as ResumeCheckResponse}
              interviewId={id}
            />
          ) : null}
        </>
      )}

      {currentStep === 'questions' && (
        <InterviewQuestionsFlow />
      )}

      {currentStep === 'ready' && (
        <ReadyToStartStep
          interviewDetails={interviewDetails || null}
          interviewId={id}
        />
      )}

      {currentStep === 'completed' && (
        <div className="text-center p-8 border rounded-lg">
          <h2 className="text-lg font-medium mb-4">Interview Completed</h2>
          <p>Results processing...</p>
        </div>
      )}
    </div>
  );
}