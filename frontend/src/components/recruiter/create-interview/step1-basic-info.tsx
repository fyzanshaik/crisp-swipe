import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { FileText, Briefcase } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { CreateInterviewFormData, ValidationErrors } from "./types";

interface Step1BasicInfoProps {
  formData: CreateInterviewFormData;
  errors: ValidationErrors;
  onUpdate: (updates: Partial<CreateInterviewFormData>) => void;
  onNext: () => void;
  onCancel: () => void;
}

export const Step1BasicInfo = memo<Step1BasicInfoProps>(
  ({ formData, errors, onUpdate, onNext, onCancel }) => {
    const [localTitle, setLocalTitle] = useState(formData.title);
    const [localDescription, setLocalDescription] = useState(formData.description);

    const debouncedTitle = useDebounce(localTitle, 300);
    const debouncedDescription = useDebounce(localDescription, 500);

    useEffect(() => {
      if (debouncedTitle !== formData.title) {
        onUpdate({ title: debouncedTitle });
      }
    }, [debouncedTitle]);

    useEffect(() => {
      if (debouncedDescription !== formData.description) {
        onUpdate({ description: debouncedDescription });
      }
    }, [debouncedDescription]);

    const handleTitleChange = useCallback((value: string) => {
      setLocalTitle(value);  
    }, []);

    const handleJobRoleChange = useCallback((value: string) => {
      onUpdate({ jobRole: value });  
    }, [onUpdate]);

    const handleDescriptionChange = useCallback((value: string) => {
      setLocalDescription(value);  
    }, []);

    const canProceed = useMemo(() => {
      return debouncedTitle.trim().length > 0 && formData.jobRole.trim().length > 0;
    }, [debouncedTitle, formData.jobRole]);

    return (
      <>
        <div className="px-8 pt-6 pb-5 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Create New Interview
            </DialogTitle>
            <DialogDescription className="text-base">
              Step 1 of 3: Set up the basic information for your interview
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-8 py-6" style={{ maxHeight: 'calc(95vh - 280px)' }}>
          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Interview Title *
            </Label>
            <Input
              id="title"
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., Frontend Developer Assessment"
              className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {localTitle.length}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobRole" className="text-sm font-medium flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              Job Role *
            </Label>
            <select
              id="jobRole"
              value={formData.jobRole}
              onChange={(e) => handleJobRoleChange(e.target.value)}
              className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.jobRole ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            >
              <option value="">Select a role...</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Mobile Developer">Mobile Developer</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Product Manager">Product Manager</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="Other">Other</option>
            </select>
            {errors.jobRole && (
              <p className="text-xs text-destructive">{errors.jobRole}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <textarea
              id="description"
              value={localDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Brief description about the role, requirements, or focus areas..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {localDescription.length}/500 characters
            </p>
          </div>

          {canProceed && (
            <div className="bg-muted/50 rounded-lg p-3 border">
              <h4 className="text-sm font-medium mb-2">Interview Summary</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div><strong>Title:</strong> {debouncedTitle}</div>
                <div><strong>Role:</strong> {formData.jobRole}</div>
                {debouncedDescription && (
                  <div><strong>Description:</strong> {debouncedDescription.slice(0, 100)}{debouncedDescription.length > 100 ? '...' : ''}</div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="px-8 py-5 border-t bg-muted/30">
          <DialogFooter className="gap-2 sm:gap-3">
            <Button variant="outline" onClick={onCancel} size="lg">
              Cancel
            </Button>
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="min-w-[180px]"
              size="lg"
            >
              Next: Add Questions
            </Button>
          </DialogFooter>
        </div>
      </>
    );
  }
);

Step1BasicInfo.displayName = "Step1BasicInfo";