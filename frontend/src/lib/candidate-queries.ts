import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { candidateApi } from "./candidate-api";

export const candidateQueries = {
  dashboard: () =>
    queryOptions({
      queryKey: ["candidate", "dashboard"],
      queryFn: candidateApi.getDashboard,
      staleTime: 5 * 60 * 1000,
    }),

  resumes: () =>
    queryOptions({
      queryKey: ["candidate", "resumes"],
      queryFn: candidateApi.getResumes,
      staleTime: 5 * 60 * 1000,
    }),

  interviewDetails: (interviewId: string) =>
    queryOptions({
      queryKey: ["candidate", "interview", interviewId, "details"],
      queryFn: () => candidateApi.getInterviewDetails(interviewId),
      staleTime: 10 * 60 * 1000,
    }),

  resumeCheck: (interviewId: string) =>
    queryOptions({
      queryKey: ["candidate", "interview", interviewId, "resume-check"],
      queryFn: () => candidateApi.checkResumeEligibility(interviewId),
      staleTime: 1 * 60 * 1000,
    }),

  activeSession: () =>
    queryOptions({
      queryKey: ["candidate", "active-session"],
      queryFn: candidateApi.getActiveSession,
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    }),

  results: (sessionId: string) =>
    queryOptions({
      queryKey: ["candidate", "results", sessionId],
      queryFn: () => candidateApi.getResults(sessionId),
      staleTime: Infinity,
    }),
};

export const candidateMutations = {
  useUploadResume: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: candidateApi.uploadResume,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["candidate", "resumes"] });
        queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      },
    });
  },

  useChatWithResume: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ resumeId, messages }: { resumeId: string; messages: Array<{ role: string; content: string }> }) =>
        candidateApi.chatWithResume(resumeId, messages),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["candidate", "resumes"] });
      },
    });
  },

  useStartInterview: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ interviewId, resumeId }: { interviewId: string; resumeId: string }) =>
        candidateApi.startInterview(interviewId, resumeId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["candidate", "active-session"] });
        queryClient.invalidateQueries({ queryKey: ["candidate", "dashboard"] });
      },
    });
  },

  useSubmitAnswer: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ sessionId, data }: {
        sessionId: string;
        data: { session_token: string; question_index: number; answer: string }
      }) => candidateApi.submitAnswer(sessionId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["candidate", "active-session"] });
      },
    });
  },
};