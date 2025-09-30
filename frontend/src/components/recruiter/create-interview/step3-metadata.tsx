import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Eye, 
  EyeOff, 
  Calendar, 
  Plus, 
  X, 
  Users,
  Settings,
  Send,
  Save
} from "lucide-react";
import { toast } from "sonner";
import type { CreateInterviewFormData, ValidationErrors } from "./types";

interface Step3MetadataProps {
  formData: CreateInterviewFormData;
  errors: ValidationErrors;
  onUpdate: (updates: Partial<CreateInterviewFormData>) => void;
  onBack: () => void;
  onSubmit: (publishImmediately: boolean) => void;
  isLoading: boolean;
}

export const Step3Metadata = memo<Step3MetadataProps>(
  ({ formData, errors, onUpdate, onBack, onSubmit, isLoading }) => {
    const [emailInput, setEmailInput] = useState('');

    const handleAddEmail = useCallback(() => {
      const email = emailInput.trim().toLowerCase();
      
      if (!email) {
        toast.error("Please enter an email address");
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (formData.assignedEmails.includes(email)) {
        toast.error("Email already added");
        return;
      }

      onUpdate({ 
        assignedEmails: [...formData.assignedEmails, email] 
      });
      setEmailInput('');
      toast.success("Email added successfully");
    }, [emailInput, formData.assignedEmails, onUpdate]);

    const handleRemoveEmail = useCallback((emailToRemove: string) => {
      onUpdate({
        assignedEmails: formData.assignedEmails.filter(email => email !== emailToRemove)
      });
    }, [formData.assignedEmails, onUpdate]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddEmail();
      }
    }, [handleAddEmail]);

    const getMinDateTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); 
      return now.toISOString().slice(0, 16);
    };

    const handlePublishNow = useCallback(() => {
      console.log('🚀 Publish Now clicked');
      onSubmit(true);
    }, [onSubmit]);

    const handleSaveDraft = useCallback(() => {
      console.log('💾 Save Draft clicked');
      onSubmit(false);
    }, [onSubmit]);

    const getInterviewSummary = () => {
      const validQuestions = formData.selectedQuestions.filter(q => q !== null);
      const questionStats = validQuestions.reduce((acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
        acc.totalPoints += q.points;
        acc.totalTime += q.timeLimit;
        return acc;
      }, { 
        easy: 0, 
        medium: 0, 
        hard: 0, 
        totalPoints: 0, 
        totalTime: 0 
      });

      return questionStats;
    };

    const summary = getInterviewSummary();

    return (
      <>
        <div className="px-8 pt-6 pb-5 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Interview Settings
            </DialogTitle>
            <DialogDescription className="text-base">
              Step 3 of 3: Configure candidate access and publish your interview
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-8 py-6" style={{ maxHeight: 'calc(95vh - 280px)' }}>
          <div className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-4 border">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Interview Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">{formData.title}</div>
                <div className="text-muted-foreground">{formData.jobRole}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formData.selectedQuestions.length} Questions</div>
                <div className="text-muted-foreground">{Math.ceil(summary.totalTime / 60)} minutes</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Candidate Access</Label>
            <div className="space-y-2">
              <div 
                className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  formData.isPublic 
                    ? 'border-primary bg-primary/5' 
                    : 'border-input hover:border-muted-foreground/25'
                }`}
                onClick={() => onUpdate({ isPublic: true, assignedEmails: [] })}
              >
                <input
                  type="radio"
                  checked={formData.isPublic}
                  onChange={() => onUpdate({ isPublic: true, assignedEmails: [] })}
                  className="h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-medium">Public Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the interview link can take it. Best for open applications.
                  </p>
                </div>
              </div>
              
              <div 
                className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  !formData.isPublic 
                    ? 'border-primary bg-primary/5' 
                    : 'border-input hover:border-muted-foreground/25'
                }`}
                onClick={() => onUpdate({ isPublic: false })}
              >
                <input
                  type="radio"
                  checked={!formData.isPublic}
                  onChange={() => onUpdate({ isPublic: false })}
                  className="h-4 w-4 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <EyeOff className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Private Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only assigned candidates can access. Better for invited assessments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {!formData.isPublic && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Candidates *
              </Label>
              
              <div className="flex gap-2">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter candidate email..."
                  className={errors.assignedEmails ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                <Button 
                  type="button"
                  onClick={handleAddEmail}
                  disabled={!emailInput.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {errors.assignedEmails && (
                <p className="text-xs text-destructive">{errors.assignedEmails}</p>
              )}

              {formData.assignedEmails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {formData.assignedEmails.length} candidate(s) assigned:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {formData.assignedEmails.map((email, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2"
                      >
                        <span className="text-sm font-mono">{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmail(email)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <input
              id="deadline"
              type="datetime-local"
              value={formData.deadline}
              min={getMinDateTime()}
              onChange={(e) => onUpdate({ deadline: e.target.value })}
              className={`flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.deadline ? "border-destructive focus-visible:ring-destructive" : ""
              }`}
            />
            {errors.deadline && (
              <p className="text-xs text-destructive">{errors.deadline}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty for no deadline. Candidates can take the interview anytime.
            </p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium mb-2">Ready to Launch!</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Access:</div>
                <div className="font-medium">
                  {formData.isPublic ? 'Public' : `Private (${formData.assignedEmails.length} candidates)`}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Deadline:</div>
                <div className="font-medium">
                  {formData.deadline 
                    ? new Date(formData.deadline).toLocaleDateString() 
                    : 'No deadline'
                  }
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t bg-muted/30">
          <DialogFooter className="gap-2 sm:gap-3">
            <Button variant="outline" onClick={onBack} disabled={isLoading} size="lg">
              Back
            </Button>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading}
                size="lg"
                className="min-w-[140px]"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={handlePublishNow}
                disabled={isLoading}
                size="lg"
                className="min-w-[160px]"
              >
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </>
    );
  }
);

Step3Metadata.displayName = "Step3Metadata";
