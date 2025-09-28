export interface Interview {
  id: string;
  title: string;
  jobRole: string;
  status: 'draft' | 'published' | 'closed' | null;
  createdAt: string | null;
  description: string | null;
  isPublic: boolean | null;
  deadline: string | null;
}

export interface InterviewsData {
  interviews: Interview[];
}
