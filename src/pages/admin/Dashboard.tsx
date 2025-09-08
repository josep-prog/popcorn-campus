import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const AdminDashboard = () => {
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [pendingDeliveries, setPendingDeliveries] = useState<number | null>(null);
  const [activeClients, setActiveClients] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Total orders
        const totalOrdersRes = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true });
        setTotalOrders(totalOrdersRes.count ?? 0);

        // Total revenue (sum of payments.amount)
        const paymentsRes = await supabase
          .from("payments")
          .select("amount");
        const revenue = (paymentsRes.data || []).reduce((sum: number, row: any) => sum + (row.amount || 0), 0);
        setTotalRevenue(revenue);

        // Pending deliveries: orders that are confirmed but not delivered
        const pendingRes = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "confirmed");
        setPendingDeliveries(pendingRes.count ?? 0);

        // Active clients: distinct non-null user_id that have at least one order
        const clientsRes = await supabase
          .from("orders")
          .select("user_id")
          .not("user_id", "is", null);
        const unique = new Set<string>((clientsRes.data || []).map((r: any) => r.user_id));
        setActiveClients(unique.size);
      } catch {
        setTotalOrders(0);
        setTotalRevenue(0);
        setPendingDeliveries(0);
        setActiveClients(0);
      }
    })();
  }, []);

  const metric = (value: number | null, suffix = "") => (
    <div className={cn("text-3xl font-bold", value === null && "opacity-60")}>{value === null ? "—" : `${value.toLocaleString()}${suffix}`}</div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Orders</CardTitle>
        </CardHeader>
        <CardContent>{metric(totalOrders)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>{metric(totalRevenue, " RWF")}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Deliveries</CardTitle>
        </CardHeader>
        <CardContent>{metric(pendingDeliveries)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active Clients</CardTitle>
        </CardHeader>
        <CardContent>{metric(activeClients)}</CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;


