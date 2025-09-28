import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";

interface MyRouterContext {
  queryClient: QueryClient;
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
