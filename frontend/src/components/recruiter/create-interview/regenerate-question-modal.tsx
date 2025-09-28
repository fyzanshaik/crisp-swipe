import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { recruiterApi } from "@/lib/recruiter-api";
import type { Question } from "./types";

interface RegenerateQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  onQuestionRegenerated: (newQuestion: Question) => void;
}

export const RegenerateQuestionModal = memo<RegenerateQuestionModalProps>(
  ({ open, onOpenChange, question, onQuestionRegenerated }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = useCallback(() => {
      setCustomPrompt('');
      onOpenChange(false);
    }, [onOpenChange]);

    const handleRegenerate = useCallback(async () => {
      if (!question || !customPrompt.trim()) {
        toast.error("Please provide a modification request");
        return;
      }

      setIsLoading(true);
      try {
        const result = await recruiterApi.regenerateQuestion({
          questionId: question.id,
          modificationRequest: customPrompt.trim()
        });

        const regeneratedQuestion = {
          ...result.question,
          category: result.question.category || undefined,
          options: result.question.options || undefined,
          correctAnswer: result.question.correctAnswer || undefined,
          expectedKeywords: result.question.expectedKeywords || undefined
        };

        onQuestionRegenerated(regeneratedQuestion);
        toast.success("Question regenerated successfully");
        handleClose();
      } catch (error) {
        console.error("Question regeneration error:", error);
        toast.error("Failed to regenerate question. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, [question, customPrompt, onQuestionRegenerated, handleClose]);

    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case 'easy': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'hard': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'mcq': return 'MCQ';
        case 'short_answer': return 'Short Answer';
        case 'code': return 'Coding';
        default: return type;
      }
    };

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[85vw] w-[85vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Regenerate Question
            </DialogTitle>
            <DialogDescription>
              Provide specific instructions for how you'd like to modify this question
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {question && (
              <div className="bg-muted/30 rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getTypeLabel(question.type)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    • {question.timeLimit}s • {question.points}pts
                  </span>
                </div>
                
                <h4 className="font-medium mb-2">Current Question:</h4>
                <p className="text-sm bg-background rounded p-3 border">
                  {question.questionText}
                </p>

                {question.options && question.options.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-2">Options:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option, idx) => (
                        <div key={idx} className="text-xs bg-background rounded p-2 border">
                          {String.fromCharCode(65 + idx)}) {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customPrompt">
                Modification Request *
              </Label>
              <textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Make it focus on React hooks instead of class components, or Add more complex scenarios, or Make it easier with clearer examples..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {customPrompt.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick suggestions:</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Make it easier with examples",
                  "Focus on practical usage",
                  "Add edge cases",
                  "Make it more challenging",
                  "Focus on best practices"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setCustomPrompt(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleRegenerate}
              disabled={!customPrompt.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate Question
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

RegenerateQuestionModal.displayName = "RegenerateQuestionModal";
