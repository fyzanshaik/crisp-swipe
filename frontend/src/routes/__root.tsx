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

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
});
