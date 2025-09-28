import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import type { AuthState } from "@/lib/auth-types";

interface MyRouterContext {
  queryClient: QueryClient;
  auth: AuthState;
}

const RootLayout = () => (
  <ThemeProvider defaultTheme="system" storageKey="crisp-ui-theme">
    <Outlet />
    <TanStackRouterDevtools />
  </ThemeProvider>
);

const ErrorComponent = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h1>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Reload Page
      </button>
    </div>
  </div>
);

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
  errorComponent: ErrorComponent,
});
