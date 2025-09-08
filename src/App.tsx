import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    (async () => {
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
        await supabase.auth.getSession();
        history.replaceState({}, "", window.location.origin + window.location.pathname);
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/order" element={<Order />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
