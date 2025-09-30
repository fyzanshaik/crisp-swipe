import { memo, useCallback, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';
import { candidateMutations } from '@/lib/candidate-queries';
import { ResumeUploadFlow } from './ResumeUploadFlow';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

type ResumeData =
  | {
      message: string;
      sessionStatus: string;
      sessionId: string;
      canResume: true;
    }
  | {
      error: string;
      sessionStatus: "completed";
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

interface SimpleResumeSelectorProps {
  data: ResumeData;
  interviewId: string;
}

export const SimpleResumeSelector = memo(function SimpleResumeSelector({
  data,
  interviewId,
}: SimpleResumeSelectorProps) {
  const { setCurrentStep } = useInterviewStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const startInterviewMutation = candidateMutations.useStartInterview();
  const uploadMutation = candidateMutations.useUploadResume();
  const [verifyingResume, setVerifyingResume] = useState<Resume | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleResumeSelect = useCallback((resumeId: string) => {
    setCurrentStep('ready');
    // Store the selected resume ID for later use
    localStorage.setItem('selectedResumeId', resumeId);
  }, [setCurrentStep]);

  const validateFile = useCallback((file: File): string | null => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return "Invalid file type. Please upload a PDF or DOCX file.";
    }

    if (file.size > maxSize) {
      return "File too large. Maximum size is 5MB.";
    }

    if (file.size === 0) {
      return "File is empty. Please select a valid file.";
    }

    if (!file.name || file.name.length > 255) {
      return "Invalid file name.";
    }

    return null;
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);

    try {
      const result = await uploadMutation.mutateAsync(file);

      clearInterval(interval);
      setUploadProgress(100);

      // Invalidate queries to refresh the UI after upload
      queryClient.invalidateQueries({
        queryKey: ["candidate", "interview", interviewId, "resume-check"]
      });
      queryClient.invalidateQueries({
        queryKey: ["candidate", "resumes"]
      });

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        if (result.status === 'verified') {
          handleResumeSelect(result.resume.id);
        }
      }, 500);
    } catch (error) {
      clearInterval(interval);
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [uploadMutation, handleResumeSelect, queryClient, interviewId, validateFile]);

  const handleIncompleteResumeClick = useCallback((resume: Resume) => {
    setVerifyingResume(resume);
  }, []);

  const handleVerificationSuccess = useCallback((resume: Resume) => {
    setVerifyingResume(null);

    // Invalidate queries to refresh the UI
    queryClient.invalidateQueries({
      queryKey: ["candidate", "interview", interviewId, "resume-check"]
    });
    queryClient.invalidateQueries({
      queryKey: ["candidate", "resumes"]
    });

    if (resume.verifiedAt && (!resume.missingFields || resume.missingFields.length === 0)) {
      handleResumeSelect(resume.id);
    }
  }, [handleResumeSelect, queryClient, interviewId]);

  if (verifyingResume) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVerifyingResume(null)}
            >
              ← Back to Resume Selection
            </Button>
          </div>
          <ResumeUploadFlow
            mode="interview"
            onSuccess={handleVerificationSuccess}
            initialResume={verifyingResume}
            existingResumes={[]}
          />
        </CardContent>
      </Card>
    );
  }

  if ('sessionStatus' in data && data.sessionStatus === 'completed') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2">Interview Already Completed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You have already completed this interview. Check your results in the Sessions tab.
          </p>
          <Button onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if ('sessionStatus' in data && 'canResume' in data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2">Active Session Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {data.message}
          </p>
          <Button onClick={() => setCurrentStep('questions')}>
            Continue Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!('interview' in data)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          {isUploading ? (
            <div className="text-center space-y-4 py-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <h3 className="text-lg font-medium">
                {uploadProgress < 90 ? 'Uploading Resume' : 'Processing Resume'}
              </h3>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 90
                  ? `${uploadProgress}% uploaded`
                  : 'AI is extracting your information...'}
              </p>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-medium mb-2">Upload New Resume</h4>
              <p className="text-sm text-muted-foreground mb-4">
                PDF or DOCX file (max 5MB)
              </p>
              <Button disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {data.incompleteResumes.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Incomplete Resumes - Need Verification
            </h4>
            <div className="space-y-2">
              {data.incompleteResumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer border-yellow-200"
                  onClick={() => handleIncompleteResumeClick(resume)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{resume.fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      Missing: {resume.missingFields?.join(', ') || 'Needs verification'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs border-yellow-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIncompleteResumeClick(resume);
                      }}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.verifiedResumes.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Verified Resumes - Ready to Use
            </h4>
            <div className="space-y-2">
              {data.verifiedResumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer border-green-200"
                  onClick={() => handleResumeSelect(resume.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{resume.fileName}</div>
                    <div className="text-xs text-muted-foreground">
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});