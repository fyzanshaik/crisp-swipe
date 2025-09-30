import { memo, useCallback, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Code, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';
import { CodeEditor } from './CodeEditor';

interface Question {
  id: string;
  type: 'mcq' | 'short_answer' | 'code';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: string[];
  starterCode?: string;
  timeLimit: number;
}

interface QuestionRendererProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  points: number;
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export const QuestionRenderer = memo(function QuestionRenderer({
  question,
  questionIndex,
  totalQuestions,
  points,
  onSubmit,
  isSubmitting,
}: QuestionRendererProps) {
  const currentAnswer = useInterviewStore((state) => state.currentAnswer);
  const setCurrentAnswer = useInterviewStore((state) => state.setCurrentAnswer);
  const hasReachedMinTime = useInterviewStore((state) => state.hasReachedMinTime);

  const [localAnswer, setLocalAnswer] = useState(currentAnswer);

  useEffect(() => {
    setLocalAnswer(currentAnswer);
  }, [currentAnswer]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localAnswer !== currentAnswer) {
        setCurrentAnswer(localAnswer);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localAnswer]);

  const handleSubmit = useCallback(() => {
    const answerToSubmit = localAnswer.trim() || currentAnswer.trim();
    if (answerToSubmit) {
      onSubmit(answerToSubmit);
    }
  }, [localAnswer, currentAnswer, onSubmit]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'border-green-500 text-green-600 bg-green-500/10';
      case 'medium': return 'border-yellow-500 text-yellow-600 bg-yellow-500/10';
      case 'hard': return 'border-red-500 text-red-600 bg-red-500/10';
      default: return 'border-border text-foreground bg-secondary';
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'mcq': return <CheckCircle className="h-4 w-4" />;
      case 'short_answer': return <MessageSquare className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      default: return null;
    }
  };

  const renderAnswerInput = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={setCurrentAnswer}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label
                  htmlFor={`option-${index}`}
                  className="text-sm cursor-pointer flex-1 p-2 rounded hover:bg-muted/50"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'short_answer':
        return (
          <Textarea
            value={localAnswer}
            onChange={(e) => setLocalAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
        );

      case 'code':
        return (
          <CodeEditor
            value={localAnswer}
            onChange={setLocalAnswer}
            placeholder={question.starterCode || "// Write your code here..."}
            disabled={isSubmitting}
            language="javascript"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm font-semibold px-3 py-1">
                Question {questionIndex + 1} / {totalQuestions}
              </Badge>
              <Badge
                className={`text-sm border ${getDifficultyColor(question.difficulty)} px-3 py-1`}
              >
                {question.difficulty.toUpperCase()}
              </Badge>
              <Badge variant="secondary" className="text-sm flex items-center gap-1.5 px-3 py-1">
                {getQuestionIcon(question.type)}
                {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'short_answer' ? 'Short Answer' : 'Coding'}
              </Badge>
            </div>
            <Badge variant="default" className="text-sm font-semibold px-3 py-1">
              {points} Points
            </Badge>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-primary pl-4">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {question.questionText}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border"></div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Answer</h4>
                <div className="h-px flex-1 bg-border"></div>
              </div>
              {renderAnswerInput()}
            </div>

            <div className="flex items-center justify-between pt-6 border-t-2">
              <div className="text-sm">
                {!hasReachedMinTime ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Please spend more time reviewing this question</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {question.type === 'mcq' && 'Select one option to proceed'}
                    {question.type === 'short_answer' && 'Provide a brief explanation'}
                    {question.type === 'code' && 'Write your complete solution'}
                  </span>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!localAnswer.trim() || isSubmitting || !hasReachedMinTime}
                size="lg"
                className="min-w-[140px]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});