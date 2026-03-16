import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginPrompt from "./components/LoginPrompt";
import ProfileSetup from "./components/ProfileSetup";
import { EasyModeProvider } from "./contexts/EasyModeContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import HistoryPage from "./pages/HistoryPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PricingPage from "./pages/PricingPage";
import ScanDetailPage from "./pages/ScanDetailPage";
import ScannerPage from "./pages/ScannerPage";

// -- Route definitions --
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: ScannerPage,
});

const historyRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/history",
  component: HistoryPage,
});

const scanDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/scan/$id",
  component: ScanDetailPage,
});

const pricingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/pricing",
  component: PricingPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    historyRoute,
    scanDetailRoute,
    pricingRoute,
    paymentSuccessRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// -- App layout with auth logic --
function AppLayout() {
  const { identity, loginStatus } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === "initializing";

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <LoginPrompt />
        <Footer />
      </div>
    );
  }

  const showProfileSetup = !profileLoading && isFetched && userProfile === null;
  if (showProfileSetup) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <ProfileSetup />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <EasyModeProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </EasyModeProvider>
    </ThemeProvider>
  );
}
