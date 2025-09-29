import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { candidateMutations } from "@/lib/candidate-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";

// Types - matching the dashboard Resume interface
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

interface ResumeUploadFlowProps {
  mode: "standalone" | "interview";
  onSuccess: (resume: Resume) => void;
  existingResumes?: Resume[];
  initialResume?: Resume;
}

type FlowState =
  | "initial"
  | "uploading"
  | "processing"
  | "verification_check"
  | "success"
  | "chat_mode"
  | "chat_processing"
  | "final_success";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ResumeUploadFlow({
  mode,
  onSuccess,
  existingResumes = [],
  initialResume,
}: ResumeUploadFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>("initial");
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = candidateMutations.useUploadResume();
  const chatMutation = candidateMutations.useChatWithResume();

  useEffect(() => {
    if (!initialResume) return;

    setCurrentResume(initialResume);

    const needsCompletion =
      !initialResume.verifiedAt ||
      (initialResume.missingFields && initialResume.missingFields.length > 0);

    if (needsCompletion) {
      setFlowState("chat_mode");
      if (
        initialResume.missingFields &&
        initialResume.missingFields.length > 0
      ) {
        setChatMessages([
          {
            role: "assistant",
            content: `Hi! I see your resume is missing: ${initialResume.missingFields.join(", ")}. Please provide these details to complete verification.`,
          },
        ]);
      }
    } else {
      setFlowState("final_success");
    }
  }, [initialResume]);

  const handleUploadSuccess = (data: {
    resume: Resume;
    status: string;
    missingFields?: string[];
  }) => {
    setCurrentResume(data.resume);

    if (data.status === "verified") {
      setFlowState("success");
      setTimeout(() => {
        setFlowState("final_success");
        onSuccess(data.resume);
      }, 2000);
    } else {
      setFlowState("chat_mode");
      setChatMessages([
        {
          role: "assistant",
          content: `Hi! I've processed your resume but need a few more details. Missing: ${data.missingFields?.join(", ")}. Can you help me complete them?`,
        },
      ]);
    }
  };

  const handleChatSuccess = (data: {
    message: string;
    is_complete: boolean;
  }) => {
    setChatMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.message,
      },
    ]);

    if (data.is_complete) {
      setFlowState("final_success");
      queryClient.invalidateQueries({ queryKey: ["candidate", "resumes"] });
      setTimeout(() => onSuccess(currentResume!), 1500);
    } else {
      setFlowState("chat_mode");
    }
  };

  // Handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFlowState("uploading");

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 90) {
        clearInterval(interval);
        setFlowState("processing");
        uploadMutation.mutate(file, {
          onSuccess: handleUploadSuccess,
          onError: (error) => {
            console.error("Upload failed:", error);
            setFlowState("initial");
          },
        });
      }
    }, 200);
  };

  const handleExistingResumeSelect = (resume: Resume) => {
    setCurrentResume(resume);
    setFlowState("final_success");
    onSuccess(resume);
  };

  const handleChatSubmit = () => {
    if (!currentInput.trim() || !currentResume) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: currentInput,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentInput("");
    setFlowState("chat_processing");

    chatMutation.mutate(
      {
        resumeId: currentResume.id,
        messages: [...chatMessages, userMessage],
      },
      {
        onSuccess: handleChatSuccess,
        onError: (error) => {
          console.error("Chat failed:", error);
          setFlowState("chat_mode");
        },
      },
    );
  };

  const renderContent = () => {
    switch (flowState) {
      case "initial":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {mode === "interview"
                  ? "Select Resume for Interview"
                  : "Upload Resume"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mode === "interview"
                  ? "Choose an existing resume or upload a new one"
                  : "Upload your resume and we'll extract the key information"}
              </p>
            </div>

            {/* Existing Resumes (for interview mode) */}
            {mode === "interview" && existingResumes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Use Existing Resume</h4>
                <div className="space-y-2">
                  {existingResumes.map((resume) => (
                    <Card
                      key={resume.id}
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => handleExistingResumeSelect(resume)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {resume.fileName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {resume.extractedName} • {resume.extractedEmail}
                            </div>
                          </div>
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {resume.verifiedAt &&
                            (!resume.missingFields ||
                              resume.missingFields.length === 0)
                              ? "Verified"
                              : "Incomplete"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  or upload a new resume below
                </div>
              </div>
            )}

            {/* Upload Section */}
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-medium mb-2">Upload Resume</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Click to select PDF or DOCX file (max 5MB)
              </p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        );

      case "uploading":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-medium">Uploading Resume</h3>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {uploadProgress}% uploaded
            </p>
          </div>
        );

      case "processing":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-medium">Processing Resume</h3>
            <p className="text-sm text-muted-foreground">
              AI is extracting your information...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-medium text-green-700 dark:text-green-300">
              Resume Uploaded Successfully!
            </h3>
            {currentResume && (
              <div className="bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-50 p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {currentResume.extractedName}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {currentResume.extractedEmail}
                </div>
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {currentResume.extractedPhone}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              All details verified!
            </p>
          </div>
        );

      case "chat_mode":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <h3 className="text-lg font-medium">Complete Your Resume</h3>
              <p className="text-sm text-muted-foreground">
                Help us complete the missing information
              </p>
            </div>

            {/* Chat Messages */}
            <div className="border rounded-lg p-4 space-y-4 max-h-80 overflow-y-auto bg-gray-50">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${
                      message.role === "user"
                        ? "bg-blue-600 text-white ml-4"
                        : "bg-white text-gray-800 border mr-4"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border p-3 rounded-xl text-sm shadow-sm mr-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your response..."
                onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleChatSubmit}
                disabled={!currentInput.trim() || chatMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "chat_processing":
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <h3 className="text-lg font-medium">Updating Resume</h3>
            <p className="text-sm text-muted-foreground">
              Processing your information...
            </p>
          </div>
        );

      case "final_success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <h3 className="text-lg font-medium text-green-700 dark:text-green-300">
              Resume Verified and Ready!
            </h3>
            {currentResume && (
              <div className="bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-50 p-4 rounded-lg space-y-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {currentResume.extractedName}
                </div>
                <div>
                  <span className="font-medium">Email:</span>{" "}
                  {currentResume.extractedEmail}
                </div>
                <div>
                  <span className="font-medium">Phone:</span>{" "}
                  {currentResume.extractedPhone}
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {mode === "interview"
                ? "Ready to start interview!"
                : "Resume added to your profile!"}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full mx-auto">
      <CardContent className="p-6">{renderContent()}</CardContent>
    </Card>
  );
}
