import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PWAInstallPrompt from "@/components/SimpleInstallPrompt";
import { initializeNotifications, subscribeToNotifications, sendWelcomeNotification } from "@/lib/notifications";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminClients from "./pages/admin/Clients";
import AdminPayments from "./pages/admin/Payments";
import AdminSettings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";
import { getUserRole } from "@/lib/auth";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    console.log('App component mounted - PWA Install Prompt should be loading...');
    (async () => {
      // Initialize PWA features
      try {
        const notificationsInitialized = await initializeNotifications();
        if (notificationsInitialized) {
          await subscribeToNotifications();
          // Send welcome notification after a delay
          setTimeout(() => {
            sendWelcomeNotification();
          }, 3000);
        }
      } catch (error) {
        console.error('Failed to initialize PWA features:', error);
      }

      // Handle PKCE flow (code in query)
      const hasCode = typeof window !== "undefined" && window.location.search.includes("code=");
      if (hasCode) {
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
          history.replaceState({}, "", window.location.origin + window.location.pathname);
        } catch {
          // ignore; fall through to hash handling
        }
      }

      // Handle implicit flow (tokens in hash)
      const hasTokenHash = typeof window !== "undefined" && window.location.hash.includes("access_token");
      if (hasTokenHash) {
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user;
        if (authUser) {
          // Ensure profiles table has up-to-date name after OAuth
          const fallbackName = (authUser.user_metadata as any)?.full_name || (authUser.user_metadata as any)?.name || authUser.email || "User";
          try {
            await supabase
              .from("profiles")
              .upsert({ id: authUser.id, full_name: fallbackName, phone: (authUser.user_metadata as any)?.phone || null })
              .eq("id", authUser.id);
          } catch {}
        }
        history.replaceState({}, "", window.location.origin + window.location.pathname);
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/order" element={<Order />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/oauth-complete" element={<OAuthComplete />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PWAInstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

const OAuthComplete = () => {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        // Handle PKCE or implicit tokens, then decide where to go
        await supabase.auth.getSession();
        const role = await getUserRole();
        navigate(role === "admin" ? "/admin" : "/dashboard");
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate]);
  return null;
};
