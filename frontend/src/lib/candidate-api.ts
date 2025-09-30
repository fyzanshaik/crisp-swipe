import { hc } from "hono/client";
import type { ApiRoutes } from "@server/app";

const client = hc<ApiRoutes>("/");
const api = client.api;

export const candidateApi = {
  getDashboard: async () => {
    const res = await api.candidate.dashboard.$get();
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error ? String(error.error) : "Failed to fetch dashboard",
      );
    }
    return res.json();
  },

  getResumes: async () => {
    const res = await api.candidate.resumes.$get();
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error ? String(error.error) : "Failed to fetch resumes",
      );
    }
    return res.json();
  },

  uploadResume: async (file: File) => {
    const res = await api.candidate.resumes.upload.$post({
      form: {
        file: file,
      },
    });
    if (!res.ok) {
      const error = await res.json();
      const errorMessage =
        "message" in error ? String(error.message) :
        "error" in error ? String(error.error) :
        "Failed to upload resume";
      throw new Error(errorMessage);
    }
    return res.json();
  },

  chatWithResume: async (
    resumeId: string,
    messages: Array<{ role: string; content: string }>,
  ) => {
    const res = await api.candidate.resumes[":id"].chat.$post({
      param: { id: resumeId },
      json: { messages },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error ? String(error.error) : "Failed to process chat",
      );
    }
    return res.json();
  },

  getInterviewDetails: async (interviewId: string) => {
    const res = await api.candidate.interviews[":id"].details.$get({
      param: { id: interviewId },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error
          ? String(error.error)
          : "Failed to fetch interview details",
      );
    }
    return res.json();
  },

  checkResumeEligibility: async (interviewId: string) => {
    const res = await api.candidate.interviews[":id"]["resume-check"].$get({
      param: { id: interviewId },
    });
    if (!res.ok) {
      const errorData = await res.json();
      const hasError = errorData && typeof errorData === "object" && "error" in errorData;
      const hasSessionStatus = errorData && typeof errorData === "object" && "sessionStatus" in errorData;

      if (
        res.status === 403 &&
        hasSessionStatus &&
        errorData.sessionStatus === "completed"
      ) {
        return {
          error: hasError ? String(errorData.error) : "Interview already completed",
          sessionStatus: "completed" as const,
        };
      }
      throw new Error(
        hasError
          ? String(errorData.error)
          : "Failed to check resume eligibility",
      );
    }
    return res.json();
  },

  startInterview: async (interviewId: string, resumeId: string) => {
    const res = await api.candidate.interviews[":id"].start.$post({
      param: { id: interviewId },
      json: { resumeId },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error ? String(error.error) : "Failed to start interview",
      );
    }
    return res.json();
  },

  getActiveSession: async () => {
    const res = await api.candidate.interviews.active.$get();
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error
          ? String(error.error)
          : "Failed to fetch active session",
      );
    }
    return res.json();
  },

  submitAnswer: async (
    sessionId: string,
    data: {
      session_token: string;
      question_index: number;
      answer: string;
    },
  ) => {
    const res = await api.candidate.interviews[":sessionId"].answers.$post({
      param: { sessionId },
      json: data,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error ? String(error.error) : "Failed to submit answer",
      );
    }
    return res.json();
  },

  getResults: async (sessionId: string) => {
    const res = await api.candidate.results[":sessionId"].$get({
      param: { sessionId },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        "error" in error ? String(error.error) : "Failed to fetch results",
      );
    }
    return res.json();
  },
};
