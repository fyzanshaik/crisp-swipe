export interface User {
  id: string;
  email: string;
  name: string;
  role: "candidate" | "recruiter";
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
