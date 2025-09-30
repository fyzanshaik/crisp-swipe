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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-2">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">{interview.title}</h2>
            <p className="text-lg text-muted-foreground">Ready to begin your interview</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 rounded-lg bg-card border-2">
              <div className="text-3xl font-bold text-primary mb-1">{interview.totalQuestions}</div>
              <div className="text-sm font-medium text-muted-foreground">Questions</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card border-2">
              <div className="text-3xl font-bold text-primary mb-1">
                {Math.round(interview.totalTime / 60)}m
              </div>
              <div className="text-sm font-medium text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card border-2">
              <div className="text-3xl font-bold text-primary mb-1">{interview.totalPoints}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Points</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Question Overview</h3>
            </div>
            <div className="space-y-3">
              {interview.questionsSummary.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-2 rounded-lg bg-card hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-muted-foreground">Q{i + 1}</span>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'short_answer' ? 'Short Answer' : 'Coding'}
                    </Badge>
                    <Badge
                      className={`text-sm px-3 py-1 ${
                        q.difficulty === 'easy'
                          ? 'bg-green-500/10 text-green-600 border-green-500'
                          : q.difficulty === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500'
                            : 'bg-red-500/10 text-red-600 border-red-500'
                      }`}
                    >
                      {q.difficulty.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{q.timeLimit}s</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{q.points} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-yellow-500/50 bg-card">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Important Guidelines</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span>Once started, you cannot pause or restart the interview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span>Each question has a strict time limit with automatic submission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span>You must spend minimum 50% of time limit before submitting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span>Questions must be answered in sequential order</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span>Your progress is automatically saved - refresh to resume</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold mt-0.5">•</span>
                  <span>Ensure stable internet connection throughout the interview</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleGoBack} size="lg" className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Change Resume
        </Button>
        <Button
          onClick={handleStartInterview}
          disabled={startInterviewMutation.isPending}
          size="lg"
          className="flex-1 text-lg"
        >
          {startInterviewMutation.isPending ? (
            'Starting Interview...'
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start Interview
            </>
          )}
        </Button>
      </div>
    </div>
  );
});