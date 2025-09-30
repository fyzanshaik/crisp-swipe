import { createFileRoute, redirect, Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { Brain, LogOut, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { userQueryOptions } from "@/lib/api";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context;
    try {
      const data = await queryClient.ensureQueryData(userQueryOptions);
      if (!data?.user) {
        throw redirect({ to: "/login", search: { redirect: location.href } });
      }
    } catch (e) {
      console.error("Authentication check failed", e);
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold leading-tight">Crisp</span>
                <span className="text-xs text-muted-foreground leading-tight capitalize">{user?.role}</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{user?.name}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{user?.email}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}