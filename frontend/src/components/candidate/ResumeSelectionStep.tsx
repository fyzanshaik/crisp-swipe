import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResumeUploadFlow } from './ResumeUploadFlow';
import { CheckCircle, FileText, Upload } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';
import { candidateMutations } from '@/lib/candidate-queries';

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

type ResumeCheckData =
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
      verifiedResumes: Resume[];
      incompleteResumes: Resume[];
      requiresUpload: boolean;
    };

interface ResumeSelectionStepProps {
  resumeCheckData: ResumeCheckData;
  interviewId: string;
}

export const ResumeSelectionStep = memo(function ResumeSelectionStep({
  resumeCheckData,
  interviewId,
}: ResumeSelectionStepProps) {
  const { setCurrentStep } = useInterviewStore();
  const startInterviewMutation = candidateMutations.useStartInterview();

  const handleResumeSelect = async (resumeId: string) => {
    try {
      await startInterviewMutation.mutateAsync({
        interviewId,
        resumeId,
      });
      setCurrentStep('questions');
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  const handleUploadSuccess = (resume: Resume) => {
    if (resume.verifiedAt && (!resume.missingFields || resume.missingFields.length === 0)) {
      handleResumeSelect(resume.id);
    }
  };

  if ('sessionStatus' in resumeCheckData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium mb-2">Session Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {resumeCheckData.message}
            </p>
            <Button onClick={() => setCurrentStep('questions')}>
              Resume Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resumeCheckData.requiresUpload) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Upload Resume Required</h3>
            <p className="text-sm text-muted-foreground">
              Please upload your resume to start the interview
            </p>
          </div>
          <ResumeUploadFlow
            mode="interview"
            onSuccess={handleUploadSuccess}
            existingResumes={[]}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-medium mb-2">Select Resume</h3>
          <p className="text-sm text-muted-foreground">
            Choose a verified resume to start your interview
          </p>
        </div>

        {resumeCheckData.verifiedResumes.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium">Verified Resumes</h4>
            {resumeCheckData.verifiedResumes.map((resume) => (
              <Card
                key={resume.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                onClick={() => handleResumeSelect(resume.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{resume.fileName}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {resume.extractedName} • {resume.extractedEmail}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      <Button
                        size="sm"
                        disabled={startInterviewMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResumeSelect(resume.id);
                        }}
                      >
                        {startInterviewMutation.isPending ? 'Starting...' : 'Select'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {resumeCheckData.incompleteResumes.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium">Incomplete Resumes</h4>
            <p className="text-xs text-muted-foreground">
              These resumes need completion before use
            </p>
            {resumeCheckData.incompleteResumes.map((resume) => (
              <Card
                key={resume.id}
                className="border-l-4 border-l-yellow-500 opacity-60"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{resume.fileName}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Missing: {resume.missingFields?.join(', ')}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Incomplete
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="pt-4 border-t">
          <ResumeUploadFlow
            mode="interview"
            onSuccess={handleUploadSuccess}
            existingResumes={resumeCheckData.verifiedResumes}
          />
        </div>
      </CardContent>
    </Card>
  );
});