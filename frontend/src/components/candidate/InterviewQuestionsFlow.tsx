import { memo, useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { candidateQueries, candidateMutations } from '@/lib/candidate-queries';
import { useInterviewStore } from '@/stores/interview-store';
import { QuestionTimer } from './QuestionTimer';
import { QuestionRenderer } from './QuestionRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'mcq' | 'short_answer' | 'code';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: string[];
  starterCode?: string;
  timeLimit: number;
}

interface QuestionData {
  questionIndex: number;
  question: Question;
  points: number;
}

interface ActiveSession {
  id: string;
  sessionToken: string;
  startedAt: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: QuestionData[];
  timeRemaining: number;
  totalElapsed: number;
  serverTime: string;
  canResume: boolean;
  wasAutoAdvanced?: boolean;
}

export const InterviewQuestionsFlow = memo(function InterviewQuestionsFlow() {
  const { setCurrentStep } = useInterviewStore();
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(Date.now());
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [hasShownAutoAdvanceAlert, setHasShownAutoAdvanceAlert] = useState(false);
  const router = useRouter();
  const submitAnswerMutation = candidateMutations.useSubmitAnswer();

  const { data: activeSession, isLoading, refetch } = useQuery({
    ...candidateQueries.activeSession(),
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const session = activeSession?.activeSession as ActiveSession | null;

  useEffect(() => {
    if (session?.wasAutoAdvanced && !hasShownAutoAdvanceAlert) {
      alert('You were moved forward due to time expiry on previous question(s).');
      setHasShownAutoAdvanceAlert(true);
    }
  }, [session?.wasAutoAdvanced, hasShownAutoAdvanceAlert]);

  useEffect(() => {
    if (!session) return;

    const serverStartTime = new Date(session.startedAt).getTime();
    const serverNow = new Date(session.serverTime).getTime();
    const localNow = Date.now();
    const timeDrift = localNow - serverNow;

    let timeAccountedFor = 0;
    for (let i = 0; i < session.currentQuestionIndex; i++) {
      timeAccountedFor += session.questions[i]?.question.timeLimit || 0;
    }

    const questionStartTime = serverStartTime + timeAccountedFor * 1000 + timeDrift;

    setCurrentQuestionStartTime(questionStartTime);
    useInterviewStore.getState().setCurrentAnswer('');
    useInterviewStore.getState().setHasReachedMinTime(false);
    useInterviewStore.getState().setQuestionStartTime(questionStartTime);
  }, [session?.currentQuestionIndex, session?.startedAt]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!session || submitAnswerMutation.isPending) return;

    const currentQuestionIndex = session.currentQuestionIndex;

    try {
      const result = await submitAnswerMutation.mutateAsync({
        sessionId: session.id,
        data: {
          session_token: session.sessionToken,
          question_index: currentQuestionIndex,
          answer: answer,
        },
      });

      useInterviewStore.getState().setCurrentAnswer('');

      if (result.completed) {
        setShowCompletionMessage(true);
        setTimeout(() => {
          router.navigate({ to: '/candidate/dashboard' });
        }, 3000);
      } else {
        await refetch();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  }, [session, submitAnswerMutation, router, refetch]);

  const handleTimeUp = useCallback(() => {
    if (!session) return;

    const currentAnswer = useInterviewStore.getState().currentAnswer;
    handleSubmitAnswer(currentAnswer || 'No answer provided (time expired)');
  }, [session, handleSubmitAnswer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-medium mb-2">No Active Session</h3>
          <p className="text-sm text-muted-foreground mb-4">
            No active interview session found. Please start an interview first.
          </p>
          <Button onClick={() => setCurrentStep('resume-check')}>
            Start New Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!session.canResume) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium mb-2">Session Expired</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your interview session has expired due to inactivity.
          </p>
          <Button onClick={() => setCurrentStep('resume-check')}>
            Start New Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];

  if (showCompletionMessage) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
          <h3 className="text-xl font-semibold mb-4 text-green-700">Interview Completed!</h3>
          <p className="text-base text-muted-foreground mb-4">
            Thank you for completing the interview. Your responses have been submitted successfully.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Please wait while your results are being processed. You will be redirected to your dashboard shortly.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Redirecting to dashboard...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-medium mb-2">Interview Completed!</h3>
          <p className="text-sm text-muted-foreground">
            All questions have been answered. Your results are being processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <QuestionTimer
          timeLimit={currentQuestion.question.timeLimit}
          onTimeUp={handleTimeUp}
          questionStartedAt={currentQuestionStartTime}
        />

        <Card className="mt-4">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Questions</span>
                <span>{session.currentQuestionIndex + 1} / {session.totalQuestions}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((session.currentQuestionIndex + 1) / session.totalQuestions) * 100}%`
                  }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {session.questions.map((q, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between text-xs p-2 rounded ${
                    index === session.currentQuestionIndex
                      ? 'bg-primary/10 text-primary'
                      : index < session.currentQuestionIndex
                        ? 'bg-green-50 text-green-700'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span>Q{index + 1}: {q.question.type.toUpperCase()}</span>
                  {index < session.currentQuestionIndex && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {index === session.currentQuestionIndex && (
                    <Badge variant="outline" className="text-xs py-0">
                      Current
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <QuestionRenderer
          question={currentQuestion.question}
          questionIndex={session.currentQuestionIndex}
          totalQuestions={session.totalQuestions}
          points={currentQuestion.points}
          onSubmit={handleSubmitAnswer}
          isSubmitting={submitAnswerMutation.isPending}
        />
      </div>
    </div>
  );
});