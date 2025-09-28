import { memo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Sparkles, RefreshCw, Trash2, Clock, Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { recruiterApi } from "@/lib/recruiter-api";
import { RegenerateQuestionModal } from "./regenerate-question-modal";
import { QuestionBankModal } from "./question-bank-modal";
import type { CreateInterviewFormData, ValidationErrors, Question } from "./types";
import { JOB_ROLE_TECHNOLOGIES } from "./types";

interface Step2QuestionSelectionProps {
  formData: CreateInterviewFormData;
  errors: ValidationErrors;
  onUpdate: (updates: Partial<CreateInterviewFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const QuestionSlot = memo<{
  question: Question | null;
  index: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'short_answer' | 'code';
  onRegenerate: () => void;
  onRemove: () => void;
  onSelectFromBank: () => void;
  isRegenerating: boolean;
}>(({ question, index, difficulty, type, onRegenerate, onRemove, onSelectFromBank, isRegenerating }) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-50 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'hard': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (questionType: string) => {
    switch (questionType) {
      case 'mcq': return 'MCQ';
      case 'short_answer': return 'Short Answer';
      case 'code': return 'Coding';
      default: return questionType;
    }
  };

  if (question) {
  return (
      <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded">Q{index + 1}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </span>
            <span className="px-2 py-1 rounded bg-muted text-xs">
              {getTypeLabel(question.type)}
            </span>
          </div>
          
          <p className="text-sm font-medium line-clamp-2">
            {question.questionText}
          </p>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{question.timeLimit}s</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{question.points}pts</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 ml-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="h-7 w-7 p-0"
            title="Regenerate this question"
          >
            <RefreshCw className={`h-3 w-3 ${isRegenerating ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Remove this question"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {question.options && question.options.length > 0 && (
          <div className="pt-2 border-t mt-2">
          <div className="grid grid-cols-2 gap-1">
            {question.options.slice(0, 4).map((option, idx) => (
              <div key={idx} className="bg-muted/30 px-2 py-1 rounded text-xs truncate">
                {String.fromCharCode(65 + idx)}) {option}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed rounded-lg p-4 text-center">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">Q{index + 1}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
          <span className="px-2 py-1 rounded bg-muted text-xs">
            {getTypeLabel(type)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">No question generated</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectFromBank}
          className="text-xs h-7"
        >
          <Plus className="h-3 w-3 mr-1" />
          Select from Bank
        </Button>
      </div>
    </div>
  );
});

QuestionSlot.displayName = "QuestionSlot";

const QuestionSection = memo<{
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: (Question | null)[];
  expectedType: 'mcq' | 'short_answer' | 'code';
  onRegenerate: (index: number) => void;
  onRemove: (index: number) => void;
  onSelectFromBank: (index: number) => void;
  regeneratingIndex: number | null;
}>(({ title, difficulty, questions, expectedType, onRegenerate, onRemove, onSelectFromBank }) => (
  <div className="space-y-3">
    <h3 className="font-medium text-sm flex items-center gap-2">
      {title}
      <span className="text-xs text-muted-foreground">({questions.length} questions)</span>
    </h3>
    <div className="space-y-2">
      {questions.map((question, index) => (
        <QuestionSlot
          key={index}
          question={question}
          index={index}
          difficulty={difficulty}
          type={expectedType}
          onRegenerate={() => onRegenerate(index)}
          onRemove={() => onRemove(index)}
          onSelectFromBank={() => onSelectFromBank(index)}
          isRegenerating={false}
        />
      ))}
    </div>
  </div>
));

QuestionSection.displayName = "QuestionSection";

export const Step2QuestionSelection = memo<Step2QuestionSelectionProps>(
  ({ formData, errors, onUpdate, onNext, onBack }) => {
    console.log('🔄 Step2QuestionSelection rendering', { 
      questionsCount: formData.selectedQuestions.filter(q => q !== null).length,
      questions: formData.selectedQuestions.map((q, i) => ({ 
        slot: i, 
        question: q ? { id: q.id, difficulty: q.difficulty } : null 
      }))
    });
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [regenerateModal, setRegenerateModal] = useState<{
      open: boolean;
      question: Question | null;
      index: number | null;
    }>({ open: false, question: null, index: null });
    const [questionBankModal, setQuestionBankModal] = useState<{
      open: boolean;
      difficulty: 'easy' | 'medium' | 'hard';
      type: 'mcq' | 'short_answer' | 'code';
      globalIndex: number | null;
    }>({ open: false, difficulty: 'easy', type: 'mcq', globalIndex: null });

    const organizeQuestions = () => {
      console.log('🎯 organizeQuestions called with:', formData.selectedQuestions);
      
      const organized = {
        easy: [
          formData.selectedQuestions[0] || null,    // Slot 0
          formData.selectedQuestions[1] || null     // Slot 1
        ] as (Question | null)[],
        medium: [
          formData.selectedQuestions[2] || null,    // Slot 2
          formData.selectedQuestions[3] || null     // Slot 3
        ] as (Question | null)[],
        hard: [
          formData.selectedQuestions[4] || null,    // Slot 4
          formData.selectedQuestions[5] || null     // Slot 5
        ] as (Question | null)[]
      };

      console.log('🎯 Organized questions:', {
        easy: organized.easy.map(q => q ? { id: q.id, difficulty: q.difficulty } : null),
        medium: organized.medium.map(q => q ? { id: q.id, difficulty: q.difficulty } : null),
        hard: organized.hard.map(q => q ? { id: q.id, difficulty: q.difficulty } : null)
      });

      return organized;
    };

    const questions = organizeQuestions();
    const totalQuestions = formData.selectedQuestions.filter(q => q !== null).length;
    const hasAllQuestions = totalQuestions === 6;

    const handleGenerateAllQuestions = useCallback(async () => {
      setIsGeneratingAll(true);
      try {
        const technologies = JOB_ROLE_TECHNOLOGIES[formData.jobRole] || ['Programming', 'Problem Solving'];
        
        const result = await recruiterApi.generateQuestions({
          jobRole: formData.jobRole,
          technologies,
          customPrompt: formData.description || undefined
        });

        const transformedQuestions = result.questions.map(q => ({
          ...q,
          category: q.category || undefined,
          options: q.options || undefined,
          correctAnswer: q.correctAnswer || undefined,
          expectedKeywords: q.expectedKeywords || undefined
        }));

        const uniqueQuestions = transformedQuestions.filter((question, index, array) => 
          array.findIndex(q => q.id === question.id) === index
        );

        if (uniqueQuestions.length !== transformedQuestions.length) {
          console.warn('⚠️ Duplicate questions detected and removed:', transformedQuestions.length - uniqueQuestions.length);
        }

        const organizedQuestions: (Question | null)[] = [null, null, null, null, null, null];
        
        let easyCount = 0, mediumCount = 0, hardCount = 0;
        uniqueQuestions.forEach(q => {
          if (q.difficulty === 'easy' && easyCount < 2) {
            organizedQuestions[easyCount] = q;
            easyCount++;
          } else if (q.difficulty === 'medium' && mediumCount < 2) {
            organizedQuestions[2 + mediumCount] = q;
            mediumCount++;
          } else if (q.difficulty === 'hard' && hardCount < 2) {
            organizedQuestions[4 + hardCount] = q;
            hardCount++;
          }
        });

        console.log('🎯 Generated questions organized into slots:', organizedQuestions.map((q, i) => ({
          slot: i,
          question: q ? { id: q.id, difficulty: q.difficulty } : null
        })));

        onUpdate({ selectedQuestions: organizedQuestions });
        toast.success(`Generated ${result.questions.length} questions successfully`);
      } catch (error) {
        console.error("Question generation error:", error);
        toast.error("Failed to generate questions. Please try again.");
      } finally {
        setIsGeneratingAll(false);
      }
    }, [formData.jobRole, formData.description, onUpdate]);

    const handleRegenerateQuestion = useCallback((globalIndex: number) => {
      const question = formData.selectedQuestions[globalIndex];
      if (!question) return;

      setRegenerateModal({
        open: true,
        question,
        index: globalIndex
      });
    }, [formData.selectedQuestions]);

    const handleQuestionRegenerated = useCallback((newQuestion: Question) => {
      if (regenerateModal.index === null) return;

      const updatedQuestions = [...formData.selectedQuestions];
      updatedQuestions[regenerateModal.index] = newQuestion;
        
        onUpdate({ selectedQuestions: updatedQuestions });
      setRegenerateModal({ open: false, question: null, index: null });
    }, [formData.selectedQuestions, onUpdate, regenerateModal.index]);

    const handleRemoveQuestion = useCallback((globalIndex: number) => {
      console.log('🗑️ handleRemoveQuestion called for slot:', globalIndex);
      
      const updatedQuestions = [...formData.selectedQuestions];
      updatedQuestions[globalIndex] = null;  // Set to null, don't remove from array
      
      console.log('🎯 Fixed slot array after removal:', updatedQuestions.map((q, i) => ({
        slot: i,
        question: q ? { id: q.id, difficulty: q.difficulty } : null
      })));
      
      onUpdate({ selectedQuestions: updatedQuestions });
      toast.success("Question removed");
    }, [formData.selectedQuestions, onUpdate]);

    const handleSelectFromBank = useCallback((difficulty: 'easy' | 'medium' | 'hard', slotIndex: number) => {
      console.log('🎯 handleSelectFromBank called', { difficulty, slotIndex });
      
      const expectedType = difficulty === 'easy' ? 'mcq' : 
                          difficulty === 'medium' ? 'short_answer' : 'code';
      
      let targetGlobalIndex = 0;
      if (difficulty === 'easy') {
        targetGlobalIndex = slotIndex; 
      } else if (difficulty === 'medium') {
        targetGlobalIndex = 2 + slotIndex; 
      } else if (difficulty === 'hard') {
        targetGlobalIndex = 4 + slotIndex; 
      }
      
      console.log('🎯 Target global index calculated:', targetGlobalIndex);
      
      setQuestionBankModal({
        open: true,
        difficulty,
        type: expectedType,
        globalIndex: targetGlobalIndex
      });
    }, []);

    const handleQuestionSelectedFromBank = useCallback((selectedQuestion: Question) => {
      if (questionBankModal.globalIndex === null) return;

      console.log('🎯 handleQuestionSelectedFromBank called', { 
        targetIndex: questionBankModal.globalIndex,
        questionId: selectedQuestion.id,
        questionDifficulty: selectedQuestion.difficulty 
      });

      const updatedQuestions = [...formData.selectedQuestions];
      
      while (updatedQuestions.length < 6) {
        updatedQuestions.push(null);
      }
      
      const duplicateSlotIndex = updatedQuestions.findIndex((q, index) => 
        q !== null && q.id === selectedQuestion.id && index !== questionBankModal.globalIndex
      );
      
      if (duplicateSlotIndex !== -1) {
        console.warn('❌ Question already assigned to slot:', duplicateSlotIndex);
        toast.error(`This question is already assigned to slot ${duplicateSlotIndex + 1}. Please choose a different question.`);
        return;
      }
      
      updatedQuestions[questionBankModal.globalIndex] = selectedQuestion;
      
      console.log('🎯 Fixed slot array after placement:', updatedQuestions.map((q, i) => ({
        slot: i,
        question: q ? { id: q.id, difficulty: q.difficulty } : null
      })));
      
      onUpdate({ selectedQuestions: updatedQuestions });
      setQuestionBankModal({ open: false, difficulty: 'easy', type: 'mcq', globalIndex: null });
      toast.success(`Question assigned to slot ${questionBankModal.globalIndex + 1}`);
    }, [formData.selectedQuestions, onUpdate, questionBankModal.globalIndex]);

    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Questions
          </DialogTitle>
          <DialogDescription>
            Step 2 of 3: Generate AI-powered questions for your {formData.jobRole} interview
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[65vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">Interview Questions ({totalQuestions}/6)</h3>
              <p className="text-sm text-muted-foreground">
                Generate 6 balanced questions: 2 Easy (MCQ), 2 Medium (Short Answer), 2 Hard (Code)
                </p>
              </div>
              <Button 
                onClick={handleGenerateAllQuestions}
                disabled={isGeneratingAll}
              size="sm"
              >
                {isGeneratingAll ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate All Questions
                  </>
                )}
              </Button>
            </div>

          <div className="space-y-6">
            <QuestionSection
              title="Easy Questions (MCQ)"
              difficulty="easy"
              questions={questions.easy}
              expectedType="mcq"
              onRegenerate={(slotIndex) => {
                const globalIndex = formData.selectedQuestions.findIndex((q) => 
                  q === questions.easy[slotIndex]
                );
                if (globalIndex !== -1) handleRegenerateQuestion(globalIndex);
              }}
              onRemove={(slotIndex) => {
                const globalIndex = formData.selectedQuestions.findIndex((q) => 
                  q === questions.easy[slotIndex]
                );
                if (globalIndex !== -1) handleRemoveQuestion(globalIndex);
              }}
              onSelectFromBank={(slotIndex) => handleSelectFromBank('easy', slotIndex)}
              regeneratingIndex={null}
            />

            <QuestionSection
              title="Medium Questions (Short Answer)"
              difficulty="medium"
              questions={questions.medium}
              expectedType="short_answer"
              onRegenerate={(slotIndex) => {
                const globalIndex = formData.selectedQuestions.findIndex((q) => 
                  q === questions.medium[slotIndex]
                );
                if (globalIndex !== -1) handleRegenerateQuestion(globalIndex);
              }}
              onRemove={(slotIndex) => {
                const globalIndex = formData.selectedQuestions.findIndex((q) => 
                  q === questions.medium[slotIndex]
                );
                if (globalIndex !== -1) handleRemoveQuestion(globalIndex);
              }}
              onSelectFromBank={(slotIndex) => handleSelectFromBank('medium', slotIndex)}
              regeneratingIndex={null}
            />

            <QuestionSection
              title="Hard Questions (Code)"
              difficulty="hard"
              questions={questions.hard}
              expectedType="code"
              onRegenerate={(slotIndex) => {
                const globalIndex = formData.selectedQuestions.findIndex((q) => 
                  q === questions.hard[slotIndex]
                );
                if (globalIndex !== -1) handleRegenerateQuestion(globalIndex);
              }}
              onRemove={(slotIndex) => {
                const globalIndex = formData.selectedQuestions.findIndex((q) => 
                  q === questions.hard[slotIndex]
                );
                if (globalIndex !== -1) handleRemoveQuestion(globalIndex);
              }}
              onSelectFromBank={(slotIndex) => handleSelectFromBank('hard', slotIndex)}
              regeneratingIndex={null}
            />
            </div>

          {errors.questions && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{errors.questions}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={onNext}
            disabled={!hasAllQuestions}
          >
            Next: Set Metadata
          </Button>
        </DialogFooter>

        {/* Regenerate Question Modal */}
        <RegenerateQuestionModal
          open={regenerateModal.open}
          onOpenChange={(open) => 
            setRegenerateModal({ open, question: null, index: null })
          }
          question={regenerateModal.question}
          onQuestionRegenerated={handleQuestionRegenerated}
        />

        {/* Question Bank Modal */}
        <QuestionBankModal
          open={questionBankModal.open}
          onOpenChange={(open) => 
            setQuestionBankModal(prev => ({ ...prev, open, globalIndex: null }))
          }
          expectedDifficulty={questionBankModal.difficulty}
          expectedType={questionBankModal.type}
          onQuestionSelected={handleQuestionSelectedFromBank}
        />
      </>
    );
  }
);

Step2QuestionSelection.displayName = "Step2QuestionSelection";