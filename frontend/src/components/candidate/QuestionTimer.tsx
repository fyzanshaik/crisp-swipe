import { memo, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';

interface QuestionTimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  questionStartedAt: number;
}

export const QuestionTimer = memo(function QuestionTimer({
  timeLimit,
  onTimeUp,
  questionStartedAt,
}: QuestionTimerProps) {
  const timeRemaining = useInterviewStore((state) => state.timeRemaining);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    const minTime = Math.floor(timeLimit * 0.5);

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - questionStartedAt) / 1000);
      const remaining = Math.max(0, timeLimit - elapsed);

      useInterviewStore.getState().setTimeRemaining(remaining);
      useInterviewStore.getState().setHasReachedMinTime(elapsed >= minTime);

      if (remaining === 0) {
        onTimeUpRef.current();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, questionStartedAt]);

  const progressValue = ((timeLimit - timeRemaining) / timeLimit) * 100;
  const isLowTime = timeRemaining <= 30;
  const isCriticalTime = timeRemaining <= 10;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isCriticalTime) return 'text-red-600';
    if (isLowTime) return 'text-yellow-600';
    return 'text-primary';
  };

  const getProgressColor = () => {
    if (isCriticalTime) return 'bg-red-500';
    if (isLowTime) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="bg-background border rounded-lg p-4 sticky top-4 z-10 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${getTimerColor()}`} />
          <span className="text-sm font-medium">Time Remaining</span>
        </div>
        {isLowTime && (
          <div className="flex items-center gap-1">
            <AlertTriangle className={`h-4 w-4 ${getTimerColor()}`} />
            <span className={`text-xs font-medium ${getTimerColor()}`}>
              {isCriticalTime ? 'Critical!' : 'Low Time!'}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
          {formatTime(timeRemaining)}
        </div>
        <div className="relative">
          <Progress
            value={progressValue}
            className="h-2"
          />
          <div
            className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(timeLimit)}</span>
        </div>
      </div>

      {timeRemaining === 0 && (
        <div className="mt-3 text-center">
          <span className="text-sm font-medium text-red-600">
            Time's up! Auto-submitting...
          </span>
        </div>
      )}
    </div>
  );
});