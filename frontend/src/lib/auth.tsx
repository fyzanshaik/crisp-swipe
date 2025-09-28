import { type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, userQueryOptions } from "./api";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
  router?: {
    navigate: (options: { to: string }) => void;
  };
}

export function AuthProvider({ children, router }: AuthProviderProps) {
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
      throw new Error('error' in error ? error.error : 'Login failed');
    }

    await queryClient.invalidateQueries({ queryKey: ["get-current-user"] });
    await queryClient.refetchQueries({
      queryKey: ["get-current-user"],
      type: 'active'
    });

    const userData = await queryClient.fetchQuery(userQueryOptions);
    if (userData?.user && router) {
      const dashboardPath = userData.user.role === 'candidate' 
        ? '/candidate/dashboard' 
        : '/recruiter/dashboard';
      router.navigate({ to: dashboardPath });
    }
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
      throw new Error('error' in error ? error.error : 'Registration failed');
    }

    await queryClient.invalidateQueries({ queryKey: ["get-current-user"] });
    await queryClient.refetchQueries({
      queryKey: ["get-current-user"],
      type: 'active'
    });

    const userData = await queryClient.fetchQuery(userQueryOptions);
    if (userData?.user && router) {
      const dashboardPath = userData.user.role === 'candidate' 
        ? '/candidate/dashboard' 
        : '/recruiter/dashboard';
      router.navigate({ to: dashboardPath });
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout.$post();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      queryClient.setQueryData(["get-current-user"], null);
      queryClient.removeQueries({ queryKey: ["get-current-user"] });
      
      if (router) {
        router.navigate({ to: "/" });
      }
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
