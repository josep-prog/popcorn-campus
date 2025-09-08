import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/login");
        return;
      }
      const ok = await isAdminUser();
      if (!ok) {
        navigate("/dashboard");
        return;
      }
      setAuthorized(true);
    })();
  }, [navigate]);

  if (authorized !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Checking admin access…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold">Campus Popcorn Admin</div>
          <nav className="flex gap-4 text-sm">
            <NavLink to="." end className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Dashboard</NavLink>
            <NavLink to="orders" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Orders</NavLink>
            <NavLink to="clients" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Clients</NavLink>
            <NavLink to="payments" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Payments</NavLink>
            <NavLink to="settings" className={({ isActive }) => isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}>Settings</NavLink>
          </nav>
          <div>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >Logout</Button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;


