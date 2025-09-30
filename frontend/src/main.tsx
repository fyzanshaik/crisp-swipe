import { scan } from "react-scan";
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { useAuth } from "@/lib/use-auth";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Toaster } from "@/components/ui/sonner";

scan({
  enabled: true,
});

const queryClient = new QueryClient();

export function InnerApp() {
  return (
    <AuthProvider>
      <RouterProviderWithAuth />
    </AuthProvider>
  );
}

function RouterProviderWithAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const router = useMemo(() => createRouter({ 
    routeTree, 
    context: { 
      queryClient,
      auth: {
        user,
        isAuthenticated,
        isLoading,
      }
    } 
  }), [user, isAuthenticated, isLoading]);
  
  return (
    <RouterProvider 
      router={router} 
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <InnerApp />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
