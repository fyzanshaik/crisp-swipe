export interface CreateInterviewFormData {
  title: string;
  jobRole: string;
  description: string;
  
  selectedQuestions: (Question | null)[];
    isPublic: boolean;
  assignedEmails: string[];
  deadline: string;
  publishImmediately: boolean;
}

export interface Question {
  id: string;
  type: 'mcq' | 'short_answer' | 'code';
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  expectedKeywords?: string[];
  timeLimit: number;
  points: number;
}

export interface ValidationErrors {
  title?: string;
  jobRole?: string;
  
  questions?: string;
  
  assignedEmails?: string;
  deadline?: string;
}

export type CreateInterviewStep = 1 | 2 | 3;

export const JOB_ROLE_TECHNOLOGIES: Record<string, string[]> = {
  'Full Stack Developer': ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Express', 'REST APIs'],
  'Frontend Developer': ['React', 'TypeScript', 'CSS', 'HTML', 'JavaScript', 'Webpack'],
  'Backend Developer': ['Node.js', 'Express', 'PostgreSQL', 'REST APIs', 'Authentication', 'Database Design'],
  'Mobile Developer': ['React Native', 'TypeScript', 'Mobile UI', 'Native APIs', 'State Management'],
  'DevOps Engineer': ['Docker', 'AWS', 'CI/CD', 'Kubernetes', 'Linux', 'Infrastructure'],
  'Data Scientist': ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Analysis', 'Pandas'],
  'UI/UX Designer': ['Design Systems', 'Figma', 'User Experience', 'Accessibility', 'Prototyping'],
  'Product Manager': ['Product Strategy', 'Analytics', 'User Research', 'Roadmapping', 'Stakeholder Management'],
  'QA Engineer': ['Testing', 'Automation', 'Test Cases', 'Bug Tracking', 'Quality Assurance'],
  'Other': ['Programming', 'Problem Solving', 'Technical Knowledge', 'Best Practices']
};