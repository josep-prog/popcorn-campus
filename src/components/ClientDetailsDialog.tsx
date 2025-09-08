import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { User, Phone, Mail, Calendar, Activity } from "lucide-react";

interface ClientDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

interface ClientData {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  order_count: number;
  last_order_date: string | null;
  total_spent: number;
}

const ClientDetailsDialog = ({ isOpen, onClose, userId }: ClientDetailsDialogProps) => {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchClientData();
    }
  }, [isOpen, userId]);

  const fetchClientData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // For now, we'll get email from orders table if available
      // Note: In a production app, you might want to use a server-side function
      // or ensure the admin has proper permissions to access auth.users
      let email = null;
      try {
        const { data: orderWithEmail } = await supabase
          .from("orders")
          .select("email")
          .eq("user_id", userId)
          .not("email", "is", null)
          .limit(1)
          .maybeSingle();
        email = orderWithEmail?.email || null;
      } catch {
        email = null;
      }

      // Fetch order statistics
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_price, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const orderCount = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
      const lastOrderDate = orders?.[0]?.created_at || null;

      setClientData({
        id: (profile?.id as string) || userId,
        full_name: profile?.full_name || email || `Client ${userId.slice(0, 6)}`,
        phone: profile?.phone || null,
        email: email,
        created_at: (profile?.created_at as string) || new Date().toISOString(),
        order_count: orderCount,
        last_order_date: lastOrderDate,
        total_spent: totalSpent,
      });
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientStatus = () => {
    if (!clientData) return "Unknown";
    
    const daysSinceLastOrder = clientData.last_order_date 
      ? Math.floor((Date.now() - new Date(clientData.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (clientData.order_count === 0) return "New";
    if (daysSinceLastOrder === null) return "Inactive";
    if (daysSinceLastOrder <= 7) return "Active";
    if (daysSinceLastOrder <= 30) return "Regular";
    return "Inactive";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Regular": return "bg-blue-100 text-blue-800";
      case "New": return "bg-yellow-100 text-yellow-800";
      case "Inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Details
          </DialogTitle>
          <DialogDescription>
            Overview of the client’s profile and order history.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading client information...</div>
          </div>
        ) : clientData ? (
          <div className="space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{clientData.full_name || "Unknown Client"}</span>
                  <Badge className={getStatusColor(getClientStatus())}>
                    {getClientStatus()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{clientData.email || "Not provided"}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium">{clientData.phone || "Not provided"}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Member Since</div>
                      <div className="font-medium">
                        {new Date(clientData.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Client ID</div>
                      <div className="font-mono text-xs">{clientData.id}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{clientData.order_count}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {clientData.total_spent.toLocaleString()} RWF
                    </div>
                    <div className="text-sm text-muted-foreground">Total Spent</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {clientData.last_order_date 
                        ? new Date(clientData.last_order_date).toLocaleDateString()
                        : "Never"
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Last Order</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No client data found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailsDialog;
