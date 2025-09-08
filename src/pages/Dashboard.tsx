import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Package, Clock, MapPin, CreditCard, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface User {
  email: string;
  name: string;
  phone?: string;
  loginTime?: number;
  registrationTime?: number;
}

interface OrderHistory {
  orderId: string | number;
  portions: number;
  location: string;
  totalPrice: number;
  status: string;
  orderTime: string;
  paymentDetails?: {
    transactionId: string;
    accountName: string;
    phoneNumber: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer authoritative session from Supabase over localStorage
        const { data: authGetUser } = await supabase.auth.getUser();
        const authUser = authGetUser?.user;

        if (!authUser) {
          toast({
            title: "Access Denied",
            description: "Please log in to access your dashboard.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        const profileName = (authUser.user_metadata as any)?.full_name || authUser.email || "User";
        const normalizedUser: User = {
          email: authUser.email || "",
          name: profileName,
          loginTime: Date.now(),
        };
        setUser(normalizedUser);
        // Backfill localStorage for code that reads it elsewhere
        localStorage.setItem("user", JSON.stringify(normalizedUser));

        // Load order history from Supabase
        const userId = authUser.id;
        const { data: orders, error } = await supabase
          .from("orders")
          .select("id, portions, location, total_price, status, created_at, payments:payments(txid)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const mapped: OrderHistory[] = (orders || []).map((o: any) => ({
          orderId: o.id,
          portions: o.portions,
          location: o.location,
          totalPrice: o.total_price,
          status: o.status || "pending",
          orderTime: o.created_at,
          paymentDetails: o.payments?.[0]?.txid
            ? {
                transactionId: o.payments[0].txid,
                accountName: "",
                phoneNumber: "",
              }
            : undefined,
        }));

        setOrderHistory(mapped);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error loading user data:", error);
        navigate("/login");
      }
    };

    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}! 👋</h1>
              <p className="text-muted-foreground">
                Manage your orders and account settings
              </p>
            </div>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/order")}
              variant="campus"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="campus-input"
            >
              Back to Home
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Order History</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
          </TabsList>

          {/* Order History Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="campus-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{orderHistory.length}</div>
                </CardContent>
              </Card>

              <Card className="campus-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {orderHistory
                      .reduce((sum, order) => sum + order.totalPrice, 0)
                      .toLocaleString()} RWF
                  </div>
                </CardContent>
              </Card>

              <Card className="campus-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Favorite Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">
                    {orderHistory.length > 0 ? orderHistory[0].location : "No orders yet"}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order History List */}
            <Card className="campus-card">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Your order history and delivery details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No orders yet</p>
                    <Button
                      onClick={() => navigate("/order")}
                      variant="campus"
                    >
                      Place Your First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => {
                      const { date, time } = formatDateTime(order.orderTime);
                      return (
                        <div
                          key={order.orderId}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-semibold text-lg">
                                Order #{order.orderId}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {date} at {time}
                              </div>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>{order.portions} portion{order.portions > 1 ? "s" : ""}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{order.location}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{order.totalPrice.toLocaleString()} RWF</span>
                            </div>
                          </div>

                          {order.paymentDetails && (
                            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                              <span>Payment: {order.paymentDetails.transactionId}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="campus-card">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your personal details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg">{user.name}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  
                  {user.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-lg">{user.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="text-lg">
                      {user.registrationTime 
                        ? new Date(user.registrationTime).toLocaleDateString()
                        : "Recently"
                      }
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => toast({ title: "Feature Coming Soon", description: "Account editing will be available soon!" })}
                  >
                    Edit Account Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="campus-card">
              <CardHeader>
                <CardTitle>Support</CardTitle>
                <CardDescription>
                  Need help? Contact our support team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    For any questions or issues with your orders, reach out to us:
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Response time: Usually within 30 minutes</span>
                  </div>
                  
                  <div className="pt-2">
                    <Button className="campus-button-secondary">
                      📞 Call +250 799 373 524
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Label = ({ className, children, ...props }: { className?: string; children: React.ReactNode }) => (
  <label className={`block text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);

export default Dashboard;