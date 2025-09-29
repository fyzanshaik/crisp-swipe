import { memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Code, MessageSquare, CheckCircle } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';

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
  const { currentAnswer, setCurrentAnswer, hasReachedMinTime } = useInterviewStore();

  const handleSubmit = useCallback(() => {
    if (currentAnswer.trim()) {
      onSubmit(currentAnswer);
    }
  }, [currentAnswer, onSubmit]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="min-h-[120px] resize-none"
            disabled={isSubmitting}
          />
        );

      case 'code':
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={question.starterCode || "// Write your code here..."}
            className="min-h-[300px] font-mono text-sm resize-none"
            disabled={isSubmitting}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                Question {questionIndex + 1} of {totalQuestions}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${getDifficultyColor(question.difficulty)}`}
              >
                {question.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                {getQuestionIcon(question.type)}
                {question.type.toUpperCase()}
              </Badge>
            </div>
            <Badge variant="secondary" className="text-xs">
              {points} points
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {question.questionText}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Your Answer:</h4>
              {renderAnswerInput()}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                {!hasReachedMinTime ? (
                  <span className="text-yellow-600">
                    Please spend more time reviewing this question
                  </span>
                ) : (
                  <>
                    {question.type === 'mcq' && 'Select one option'}
                    {question.type === 'short_answer' && 'Provide a brief explanation'}
                    {question.type === 'code' && 'Write your complete solution'}
                  </>
                )}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!currentAnswer.trim() || isSubmitting || !hasReachedMinTime}
                className="min-w-[100px]"
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