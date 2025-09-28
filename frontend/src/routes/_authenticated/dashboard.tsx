import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: ({ context }) => {
    console.log("Dashboard redirect beforeLoad:", {
      isLoading: context.auth.isLoading,
      isAuthenticated: context.auth.isAuthenticated,
      userRole: context.auth.user?.role,
      user: context.auth.user
    });
    
    if (context.auth.isLoading) {
      console.log("Auth is loading, waiting...");
      return;
    }
    
    if (context.auth.user?.role === "candidate") {
      console.log("Redirecting to candidate dashboard");
      throw redirect({
        to: "/candidate/dashboard",
      });
    } else if (context.auth.user?.role === "recruiter") {
      console.log("Redirecting to recruiter dashboard");
      throw redirect({
        to: "/recruiter/dashboard",
      });
    }
    
    console.log("No valid role, redirecting to home");
    throw redirect({
      to: "/",
    });
  },
  component: () => <div>Redirecting...</div>,
});