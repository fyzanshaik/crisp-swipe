import { hc } from "hono/client";
import type { ApiRoutes } from "@server/app";

const client = hc<ApiRoutes>("/");
const api = client.api;

export const recruiterApi = {
  getDashboard: async () => {
    const res = await api.recruiter.dashboard.$get();
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to fetch dashboard');
    }
    return res.json();
  },

  getInterviews: async () => {
    const res = await api.recruiter.interviews.$get();
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to fetch interviews');
    }
    return res.json();
  },

  getInterview: async (id: string) => {
    const res = await api.recruiter.interviews[":id"].$get({ param: { id } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to fetch interview');
    }
    return res.json();
  },

  createInterview: async (data: {
    title: string;
    description?: string;
    jobRole: string;
    isPublic: boolean;
    assignedEmails?: string[];
    deadline?: string;
  }) => {
    const res = await api.recruiter.interviews.$post({ json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to create interview');
    }
    return res.json();
  },

  updateInterview: async (id: string, data: {
    title?: string;
    description?: string;
    jobRole?: string;
    isPublic?: boolean;
    assignedEmails?: string[];
    deadline?: string;
  }) => {
    const res = await api.recruiter.interviews[":id"].$put({ param: { id }, json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to update interview');
    }
    return res.json();
  },

  deleteInterview: async (id: string) => {
    const res = await api.recruiter.interviews[":id"].$delete({ param: { id } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to delete interview');
    }
    return res.json();
  },

  publishInterview: async (id: string) => {
    const res = await api.recruiter.interviews[":id"].publish.$post({ param: { id } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to publish interview');
    }
    return res.json();
  },

  closeInterview: async (id: string) => {
    const res = await api.recruiter.interviews[":id"].close.$post({ param: { id } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to close interview');
    }
    return res.json();
  },

  cloneInterview: async (id: string) => {
    const res = await api.recruiter.interviews[":id"].clone.$post({ param: { id } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to clone interview');
    }
    return res.json();
  },

  getQuestions: async (filters?: {
    type?: string;
    difficulty?: string;
    category?: string;
  }) => {
    const res = await api.recruiter.questions.$get({ query: filters });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to fetch questions');
    }
    return res.json();
  },

  createQuestion: async (data: {
    type: 'mcq' | 'short_answer' | 'code';
    difficulty: 'easy' | 'medium' | 'hard';
    category?: string;
    questionText: string;
    options?: string[];
    correctAnswer?: string;
    expectedKeywords?: string[];
    minWords?: number;
    maxWords?: number;
    language?: string;
    starterCode?: string;
    sampleSolution?: string;
    evaluationCriteria?: string[];
    timeLimit: number;
    points: number;
  }) => {
    const res = await api.recruiter.questions.$post({ json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to create question');
    }
    return res.json();
  },

  updateQuestion: async (id: string, data: {
    type?: 'mcq' | 'short_answer' | 'code';
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
    questionText?: string;
    options?: string[];
    correctAnswer?: string;
    expectedKeywords?: string[];
    minWords?: number;
    maxWords?: number;
    language?: string;
    starterCode?: string;
    sampleSolution?: string;
    evaluationCriteria?: string[];
    timeLimit?: number;
    points?: number;
  }) => {
    const res = await api.recruiter.questions[":id"].$put({ param: { id }, json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to update question');
    }
    return res.json();
  },

  deleteQuestion: async (id: string) => {
    const res = await api.recruiter.questions[":id"].$delete({ param: { id } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to delete question');
    }
    return res.json();
  },

  generateQuestions: async (data: {
    jobRole: string;
    technologies: string[];
    customPrompt?: string;
  }) => {
    const res = await api.recruiter.questions["generate-all"].$post({ json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to generate questions');
    }
    return res.json();
  },

  regenerateQuestion: async (data: {
    questionId: string;
    modificationRequest: string;
  }) => {
    const res = await api.recruiter.questions.regenerate.$post({ json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to regenerate question');
    }
    return res.json();
  },

  getCandidates: async (interviewId: string) => {
    const res = await api.recruiter.interviews[":id"].candidates.$get({ param: { id: interviewId } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to fetch candidates');
    }
    return res.json();
  },

  getCandidate: async (sessionId: string) => {
    const res = await api.recruiter.candidates[":sessionId"].$get({ param: { sessionId } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to fetch candidate');
    }
    return res.json();
  },

  updateCandidateNotes: async (sessionId: string, recruiterNotes: string) => {
    const res = await api.recruiter.candidates[":sessionId"].notes.$put({ 
      param: { sessionId }, 
      json: { recruiterNotes } 
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to update candidate notes');
    }
    return res.json();
  },

  assignQuestions: async (interviewId: string, questions: Array<{
    questionId: string;
    orderIndex: number;
    points: number;
  }>) => {
    const res = await api.recruiter.interviews[":id"].questions.$post({ 
      param: { id: interviewId }, 
      json: { questions } 
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to assign questions');
    }
    return res.json();
  },

  updateDeadline: async (interviewId: string, deadline: string) => {
    const res = await api.recruiter.interviews[":id"].deadline.$put({ 
      param: { id: interviewId }, 
      json: { deadline } 
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to update deadline');
    }
    return res.json();
  },

  assignCandidates: async (interviewId: string, emails: string[]) => {
    const res = await api.recruiter.interviews[":id"].assign.$post({ 
      param: { id: interviewId }, 
      json: { emails } 
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to assign candidates');
    }
    return res.json();
  },

  getInterviewLink: async (interviewId: string) => {
    const res = await api.recruiter.interviews[":id"].link.$get({ param: { id: interviewId } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Failed to get interview link');
    }
    return res.json();
  }
};
