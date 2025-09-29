import { memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Target, Play, ArrowLeft } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';
import { candidateMutations } from '@/lib/candidate-queries';

interface InterviewDetails {
  interview: {
    id: string;
    title: string;
    totalQuestions: number;
    totalTime: number;
    totalPoints: number;
    questionsSummary: Array<{
      type: 'mcq' | 'short_answer' | 'code';
      difficulty: 'easy' | 'medium' | 'hard';
      timeLimit: number;
      points: number;
    }>;
  };
}

interface ReadyToStartStepProps {
  interviewDetails: InterviewDetails | null;
  interviewId: string;
}

export const ReadyToStartStep = memo(function ReadyToStartStep({
  interviewDetails,
  interviewId,
}: ReadyToStartStepProps) {
  const { setCurrentStep } = useInterviewStore();
  const startInterviewMutation = candidateMutations.useStartInterview();

  const handleStartInterview = useCallback(async () => {
    const selectedResumeId = localStorage.getItem('selectedResumeId');
    if (!selectedResumeId) {
      setCurrentStep('resume-check');
      return;
    }

    try {
      await startInterviewMutation.mutateAsync({
        interviewId,
        resumeId: selectedResumeId,
      });
      localStorage.removeItem('selectedResumeId');
      setCurrentStep('questions');
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  }, [interviewId, startInterviewMutation, setCurrentStep]);

  const handleGoBack = useCallback(() => {
    setCurrentStep('resume-check');
  }, [setCurrentStep]);

  if (!interviewDetails) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading interview details...</p>
        </CardContent>
      </Card>
    );
  }

  const { interview } = interviewDetails;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{interview.title}</h3>
            <p className="text-muted-foreground">Ready to start your interview</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{interview.totalQuestions}</div>
              <div className="text-xs text-muted-foreground">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(interview.totalTime / 60)}m
              </div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{interview.totalPoints}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Question Breakdown
            </h4>
            {interview.questionsSummary.map((q, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {q.type.toUpperCase()}
                  </Badge>
                  <Badge
                    variant={
                      q.difficulty === 'easy'
                        ? 'default'
                        : q.difficulty === 'medium'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="text-xs"
                  >
                    {q.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{q.timeLimit}s</span>
                  <span>{q.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-yellow-800">Important Guidelines</h4>
              <ul className="space-y-1 text-yellow-700">
                <li>• Once started, you cannot pause or restart the interview</li>
                <li>• Each question has a strict time limit with auto-submission</li>
                <li>• You must answer questions in sequential order</li>
                <li>• Refreshing the page will resume from where you left off</li>
                <li>• Ensure stable internet connection throughout</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleGoBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change Resume
        </Button>
        <Button
          onClick={handleStartInterview}
          disabled={startInterviewMutation.isPending}
          className="flex-1"
        >
          {startInterviewMutation.isPending ? (
            'Starting...'
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Start Interview
            </>
          )}
        </Button>
      </div>
    </div>
  );
});