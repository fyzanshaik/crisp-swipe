import { create } from 'zustand';

type InterviewStep = 'resume-check' | 'ready' | 'questions' | 'completed';

interface InterviewState {
  currentStep: InterviewStep;
  timeRemaining: number;
  currentAnswer: string;
  isSubmitting: boolean;
  showWelcomeBack: boolean;
  questionStartTime: number | null;
  hasReachedMinTime: boolean;

  setCurrentStep: (step: InterviewStep) => void;
  setTimeRemaining: (time: number) => void;
  setCurrentAnswer: (answer: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setShowWelcomeBack: (show: boolean) => void;
  setQuestionStartTime: (time: number | null) => void;
  setHasReachedMinTime: (reached: boolean) => void;

  resetState: () => void;
}

const initialState = {
  currentStep: 'resume-check' as InterviewStep,
  timeRemaining: 0,
  currentAnswer: '',
  isSubmitting: false,
  showWelcomeBack: false,
  questionStartTime: null,
  hasReachedMinTime: false,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setCurrentAnswer: (answer) => set({ currentAnswer: answer }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setShowWelcomeBack: (show) => set({ showWelcomeBack: show }),
  setQuestionStartTime: (time) => set({ questionStartTime: time }),
  setHasReachedMinTime: (reached) => set({ hasReachedMinTime: reached }),

  resetState: () => set(initialState),
}));