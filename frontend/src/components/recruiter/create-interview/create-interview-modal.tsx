import { memo, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { recruiterApi } from "@/lib/recruiter-api";
import { Step1BasicInfo } from "./step1-basic-info";
import { Step2QuestionSelection } from "./step2-question-selection";
import { Step3Metadata } from "./step3-metadata";
import type { 
  CreateInterviewFormData, 
  CreateInterviewStep, 
  ValidationErrors,
  Question
} from "./types";

interface CreateInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInterviewCreated: () => void;
}

const initialFormData: CreateInterviewFormData = {
  title: '',
  jobRole: 'Full Stack Developer',
  description: '',
  
  selectedQuestions: [null, null, null, null, null, null] as (Question | null)[],
  
  isPublic: true,
  assignedEmails: [],
  deadline: '',
  publishImmediately: false,
};

export const CreateInterviewModal = memo<CreateInterviewModalProps>(
  ({ open, onOpenChange, onInterviewCreated }) => {
    const [currentStep, setCurrentStep] = useState<CreateInterviewStep>(1);
    const [formData, setFormData] = useState<CreateInterviewFormData>(initialFormData);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenChange = useCallback((newOpen: boolean) => {
      if (!newOpen) {
        setCurrentStep(1);
        setFormData(initialFormData);
        setErrors({});
        setIsLoading(false);
      }
      onOpenChange(newOpen);
    }, [onOpenChange]);

    const updateFormData = useCallback((updates: Partial<CreateInterviewFormData>) => {
      setFormData(prev => ({ ...prev, ...updates }));
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(updates).forEach(key => {
          delete newErrors[key as keyof ValidationErrors];
        });
        return newErrors;
      });
    }, []);

    const validateStep1 = useCallback((): boolean => {
      const newErrors: ValidationErrors = {};

      if (!formData.title.trim()) {
        newErrors.title = "Interview title is required";
      }

      if (!formData.jobRole.trim()) {
        newErrors.jobRole = "Job role is required";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData.title, formData.jobRole]);

    const validateStep2 = useCallback((): boolean => {
      const newErrors: ValidationErrors = {};

      const validQuestions = formData.selectedQuestions.filter(q => q !== null);
      if (validQuestions.length === 0) {
        newErrors.questions = "At least one question must be generated";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData.selectedQuestions]);

    const validateStep3 = useCallback((): boolean => {
      const newErrors: ValidationErrors = {};

      if (!formData.isPublic && formData.assignedEmails.length === 0) {
        newErrors.assignedEmails = "At least one email is required for private interviews";
      }

      if (formData.deadline) {
        const deadlineDate = new Date(formData.deadline);
        if (deadlineDate <= new Date()) {
          newErrors.deadline = "Deadline must be in the future";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }, [formData.isPublic, formData.assignedEmails.length, formData.deadline]);

    const goToNextStep = useCallback(() => {
      let isValid = false;

      switch (currentStep) {
        case 1:
          isValid = validateStep1();
          break;
        case 2:
          isValid = validateStep2();
          break;
        case 3:
          isValid = validateStep3();
          break;
      }

      if (isValid && currentStep < 3) {
        setCurrentStep(prev => (prev + 1) as CreateInterviewStep);
      }
    }, [currentStep, validateStep1, validateStep2, validateStep3]);

    const goToPreviousStep = useCallback(() => {
      if (currentStep > 1) {
        setCurrentStep(prev => (prev - 1) as CreateInterviewStep);
        setErrors({});
      }
    }, [currentStep]);

    const handleCreateInterview = useCallback(async (publishImmediately: boolean) => {
      if (!validateStep3()) {
        return;
      }

      setIsLoading(true);
      try {
        const interviewData = {
          title: formData.title,
          jobRole: formData.jobRole,
          description: formData.description || undefined,
          isPublic: formData.isPublic,
          assignedEmails: formData.assignedEmails,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        };

        const createdInterview = await recruiterApi.createInterview(interviewData);

        const questionsToAssign = formData.selectedQuestions
          .map((q, originalIndex) =>
            q ? {
              questionId: q.id,
              orderIndex: originalIndex,
              points: q.points
            } : null
          )
          .filter((q): q is { questionId: string; orderIndex: number; points: number } => q !== null);

        if (questionsToAssign.length > 0) {
          await recruiterApi.assignQuestions(createdInterview.interview.id, questionsToAssign);
        }

        if (publishImmediately) {
          await recruiterApi.publishInterview(createdInterview.interview.id);
        }
        
        toast.success(`Interview ${publishImmediately ? 'created and published' : 'saved as draft'} successfully`);
        onInterviewCreated();
        handleOpenChange(false);
      } catch (error) {
        console.error("Failed to create interview:", error);
        toast.error("Failed to create interview. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, [formData, validateStep3, onInterviewCreated, handleOpenChange]);

    const progress = useMemo(() => {
      return ((currentStep - 1) / 2) * 100;
    }, [currentStep]);

    const renderStep = () => {
      switch (currentStep) {
        case 1:
          return (
            <Step1BasicInfo
              formData={formData}
              errors={errors}
              onUpdate={updateFormData}
              onNext={goToNextStep}
              onCancel={() => handleOpenChange(false)}
            />
          );
        case 2:
          return (
            <Step2QuestionSelection
              formData={formData}
              errors={errors}
              onUpdate={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          );
        case 3:
          return (
            <Step3Metadata
              formData={formData}
              errors={errors}
              onUpdate={updateFormData}
              onBack={goToPreviousStep}
              onSubmit={handleCreateInterview}
              isLoading={isLoading}
            />
          );
        default:
          return null;
      }
    };

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0">
          <div className="relative h-1 bg-muted">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-col h-full">
            {renderStep()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

CreateInterviewModal.displayName = "CreateInterviewModal";