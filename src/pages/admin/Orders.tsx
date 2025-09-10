import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import ClientDetailsDialog from "@/components/ClientDetailsDialog";
import PaymentProofViewer from "@/components/PaymentProofViewer";

interface OrderRow {
  id: string;
  user_id: string | null;
  email?: string | null;
  portions: number;
  location: string;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_name?: string | null;
  payment_proof_url?: string | null;
  payment_proof_uploaded_at?: string | null;
  payments: Array<{ txid: string }>;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
}

const AdminOrders = () => {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      // Step 1: Fetch orders with embedded payments (FK: payments.order_id -> orders.id)
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `id,user_id,email,portions,location,total_price,status,payment_status,created_at,customer_name,payment_proof_url,payment_proof_uploaded_at,payments:payments(txid)`
        )
        .order("created_at", { ascending: false });

      if (ordersError) {
        // eslint-disable-next-line no-console
        console.error("Failed to load orders:", ordersError);
        setRows([]);
        return;
      }

      const safeOrders = orders || [];

      // Step 2: Fetch corresponding profiles in bulk (no direct FK orders.user_id -> profiles.id)
      const userIds = Array.from(
        new Set(
          safeOrders
            .map((o) => o.user_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (userIds.length === 0) {
        setRows(safeOrders as unknown as OrderRow[]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,full_name,phone")
        .in("id", userIds);

      if (profilesError) {
        // eslint-disable-next-line no-console
        console.warn("Loaded orders but failed to load profiles:", profilesError);
        setRows(safeOrders as unknown as OrderRow[]);
        return;
      }

      const profileById = new Map<string, { full_name: string | null; phone: string | null }>();
      for (const p of profiles || []) {
        profileById.set((p as any).id, { full_name: (p as any).full_name ?? null, phone: (p as any).phone ?? null });
      }

      // Step 2b: For any users without a profile name, try to fetch from auth via RPC
      const missingNameIds = userIds.filter((id) => {
        const entry = profileById.get(id);
        return !entry || !entry.full_name || entry.full_name.trim().length === 0;
      });
      if (missingNameIds.length > 0) {
        try {
          const { data: authNames } = await supabase.rpc("get_user_names", { ids: missingNameIds });
          for (const n of (authNames as any[]) || []) {
            const id = (n as any).id as string;
            const fullName = ((n as any).full_name as string | null) || null;
            const prev = profileById.get(id) || { full_name: null, phone: null };
            if (fullName && fullName.trim().length > 0) {
              profileById.set(id, { ...prev, full_name: fullName });
            }
          }
        } catch {
          // ignore RPC failures; we'll fall back to email below
        }
      }

      const merged: OrderRow[] = safeOrders.map((o: any) => ({
        ...o,
        profile: o.user_id ? profileById.get(o.user_id) : undefined,
      }));

      setRows(merged);
    })();
  }, []);

  const handleClientClick = (userId: string | null) => {
    if (userId) {
      setSelectedClientId(userId);
      setIsClientDialogOpen(true);
    }
  };

  const getClientDisplayName = (row: OrderRow) => {
    if (!row.user_id) return "Anonymous";
    if (row.profile?.full_name && row.profile.full_name.trim().length > 0) return row.profile.full_name;
    // If we don't have a profile name (e.g., historical data), show the exact email as-is
    if (row.email) return row.email;
    const short = row.user_id ? row.user_id.slice(0, 6) : "";
    return short ? `Client ${short}` : "Client";
  };

  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ payment_status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setRows(prevRows => 
        prevRows.map(row => 
          row.id === orderId 
            ? { ...row, payment_status: newStatus }
            : row
        )
      );

      toast({
        title: "Status Updated",
        description: `Payment status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`
      });
    } catch (error: any) {
      console.error("Failed to update payment status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  const getPaymentStatusBadge = (status: string, hasProof: boolean) => {
    if (status === "paid") {
      return <Badge variant="default" className="bg-green-500">Paid</Badge>;
    } else if (status === "unpaid") {
      return <Badge variant="destructive">Unpaid</Badge>;
    } else if (status === "incomplete") {
      return <Badge variant="secondary">Incomplete</Badge>;
    } else if (status === "pending" && hasProof) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending Review</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Orders</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Order ID</th>
              <th className="py-2 pr-4">Client Name</th>
              <th className="py-2 pr-4">Portions</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">Payment Proof</th>
              <th className="py-2 pr-4">Payment Status</th>
              <th className="py-2 pr-4">Order Status</th>
              <th className="py-2 pr-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4">#{r.id}</td>
                <td className="py-2 pr-4">
                  {r.user_id ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-left font-normal text-primary hover:text-primary/80"
                      onClick={() => handleClientClick(r.user_id)}
                    >
                      {getClientDisplayName(r)}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">Anonymous</span>
                  )}
                </td>
                <td className="py-2 pr-4">{r.portions}</td>
                <td className="py-2 pr-4">{r.location}</td>
                <td className="py-2 pr-4">
                  <PaymentProofViewer
                    paymentProofUrl={r.payment_proof_url}
                    customerName={r.customer_name || getClientDisplayName(r)}
                    orderId={r.id}
                    trigger={
                      r.payment_proof_url ? (
                        <Button variant="ghost" size="sm" className="h-auto p-1 text-blue-600 hover:text-blue-800">
                          View Proof
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No proof</span>
                      )
                    }
                  />
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    {getPaymentStatusBadge(r.payment_status, !!r.payment_proof_url)}
                    <Select
                      value={r.payment_status}
                      onValueChange={(value) => updatePaymentStatus(r.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
                <td className="py-2 pr-4">{r.status || "pending"}</td>
                <td className="py-2 pr-4">
                  <div className="text-sm">
                    <div>{new Date(r.created_at).toLocaleString()}</div>
                    {r.payment_proof_uploaded_at && (
                      <div className="text-xs text-muted-foreground">
                        Proof: {new Date(r.payment_proof_uploaded_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientDetailsDialog
        isOpen={isClientDialogOpen}
        onClose={() => setIsClientDialogOpen(false)}
        userId={selectedClientId}
      />
    </div>
  );
};

export default AdminOrders;


