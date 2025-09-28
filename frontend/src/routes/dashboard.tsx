import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return;
    }

    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }

    if (context.auth.user?.role === "candidate") {
      throw redirect({
        to: "/candidate/dashboard",
      });
    } else if (context.auth.user?.role === "recruiter") {
      throw redirect({
        to: "/recruiter/dashboard",
      });
    }
  },
  component: () => null, 
});