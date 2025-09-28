import { type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, userQueryOptions } from "./api";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: userData,
    isLoading,
  } = useQuery({
    ...userQueryOptions,
    retry: false,
    staleTime: 5 * 60 * 1000, 
  });

  const user = userData?.user || null;
  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    const res = await api.auth.login.$post({ json: { email, password } });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Login failed');
    }

    await queryClient.invalidateQueries({ queryKey: userQueryOptions.queryKey });
    await queryClient.ensureQueryData(userQueryOptions);
    
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: "candidate" | "recruiter";
  }) => {
    const res = await api.auth.register.$post({ json: data });
    if (!res.ok) {
      const error = await res.json();
      throw new Error('error' in error ? String(error.error) : 'Registration failed');
    }

    await queryClient.invalidateQueries({ queryKey: userQueryOptions.queryKey });
    await queryClient.ensureQueryData(userQueryOptions);
    
  };

  const logout = async () => {
    try {
      await api.auth.logout.$post();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      queryClient.setQueryData(userQueryOptions.queryKey, undefined);
      queryClient.removeQueries({ queryKey: userQueryOptions.queryKey });
      // Force a page reload to clear all state and redirect to home
      window.location.href = '/';
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
