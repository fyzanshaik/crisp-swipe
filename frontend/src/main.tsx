import { scan } from "react-scan";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/lib/auth";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
scan({
  enabled: true,
});

const queryClient = new QueryClient();
const router = createRouter({ 
  routeTree, 
  context: { 
    queryClient,
    auth: {
      user: null,
      isAuthenticated: false,
      isLoading: true,
    }
  } 
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
export function InnerApp() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <InnerApp />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
