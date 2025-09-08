import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface OrderDetails {
  orderId?: string | number;
  portions: number;
  location: string;
  totalPrice: number;
  timestamp: number;
}

const Payment = () => {
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // MoMo details sourced from environment variables (with safe fallbacks)
  const momoCode = (import.meta as any).env?.VITE_MOMO_CODE ?? "*182*81*12345#";
  const merchantName = (import.meta as any).env?.VITE_MERCHANT_NAME ?? "Campus Popcorn Ltd";

  useEffect(() => {
    const storedOrder = localStorage.getItem("currentOrder");
    if (!storedOrder) {
      toast({
        title: "No Order Found",
        description: "Please start a new order from the beginning.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    try {
      const order = JSON.parse(storedOrder) as OrderDetails;
      setOrderDetails(order);
    } catch (error) {
      console.error("Error parsing order details:", error);
      navigate("/");
    }
  }, [navigate]);

  const handlePaymentVerification = async () => {
    if (!transactionId.trim() || !accountName.trim() || !phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all payment verification details.",
        variant: "destructive",
      });
      return;
    }

    if (!orderDetails?.orderId) {
      toast({ title: "Order Missing", description: "Could not find order reference. Please restart your order.", variant: "destructive" });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Verify against Supabase messages table
      const last4 = phoneNumber.slice(-4);
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("id, txid, payer_name, phone_number, amount, received_at")
        .eq("txid", transactionId.trim())
        .ilike("payer_name", `%${accountName.trim()}%`)
        .ilike("phone_number", `%${last4}`)
        .limit(1);

      if (messagesError) {
        throw messagesError;
      }

      const matched = messages && messages.length > 0 ? messages[0] : null;

      if (!matched) {
        toast({
          title: "Payment Verification Failed",
          description: "No matching payment SMS found. Check your details and try again.",
          variant: "destructive",
        });
        return;
      }

      // Update order status and record payment
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ payment_status: "confirmed", status: "confirmed" })
        .eq("id", orderDetails.orderId);
      if (orderUpdateError) throw orderUpdateError;

      const { error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
          order_id: orderDetails.orderId,
          txid: transactionId.trim(),
          account_name: accountName.trim(),
          phone_number: phoneNumber.trim(),
          amount: orderDetails.totalPrice,
          verified_at: new Date().toISOString(),
          message_id: matched.id,
        });
      if (paymentInsertError) throw paymentInsertError;
      
        setPaymentCompleted(true);
        localStorage.removeItem("currentOrder");
        
        toast({
          title: "Payment Verified! 🎉",
          description: "Your order has been confirmed and will be delivered in 5 minutes.",
        });
        
    } catch (error: any) {
      console.error("Payment verification error:", error);
      toast({
        title: "Verification Error",
        description: error?.message || "An error occurred while verifying your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">Please start a new order.</p>
          <Button onClick={() => navigate("/")} variant="campus">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
        <Card className="campus-card max-w-lg w-full animate-fade-in">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">Payment Confirmed!</CardTitle>
            <CardDescription>Your popcorn order is being prepared</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Order Details:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Portions:</span> {orderDetails.portions}</p>
                <p><span className="text-muted-foreground">Location:</span> {orderDetails.location}</p>
                <p><span className="text-muted-foreground">Total:</span> {orderDetails.totalPrice.toLocaleString()} RWF</p>
                <p><span className="text-muted-foreground">Estimated Delivery:</span> 5 minutes</p>
              </div>
            </div>
            
            <div className="bg-accent-light rounded-lg p-4">
              <p className="text-sm font-medium text-accent-foreground mb-2">
                📧 Confirmation email sent!
              </p>
              <p className="text-xs text-muted-foreground">
                You'll receive order updates via email and SMS.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate("/")} 
                variant="campus"
                className="w-full"
              >
                Place Another Order
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                View Order History
              </Button>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need help? Contact us at <span className="font-semibold text-accent">+250 799 373 524</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/order")}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
          <p className="text-muted-foreground">
            Pay securely with MTN Mobile Money
          </p>
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="campus-card animate-fade-in">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Portions:</span>
                  <span>{orderDetails.portions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-right max-w-[60%]">{orderDetails.location}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{orderDetails.totalPrice.toLocaleString()} RWF</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="campus-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                MoMo Payment Instructions
              </CardTitle>
              <CardDescription>
                Follow these steps to complete your payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary-light/20 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 1: Dial MoMo Code</h3>
                <div className="bg-card rounded p-3 font-mono text-lg text-center border">
                  {momoCode}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Dial this code from your MTN phone to initiate payment
                </p>
              </div>
              
              <div className="bg-secondary-light/20 border border-secondary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 2: Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Merchant:</span> {merchantName}</p>
                  <p><span className="font-medium">Amount:</span> {orderDetails.totalPrice.toLocaleString()} RWF</p>
                </div>
              </div>
              
              <div className="bg-accent-light/20 border border-accent/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 3: Complete Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your PIN to confirm the payment. You'll receive an SMS confirmation.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Verification */}
          <Card className="campus-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Verify Your Payment
              </CardTitle>
              <CardDescription>
                Enter the details from your SMS confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID (TxId)</Label>
                <Input
                  id="transactionId"
                  placeholder="e.g., MP240108.1234.A12345"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="campus-input"
                />
                <p className="text-xs text-muted-foreground">
                  Found in your SMS confirmation from MTN
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  placeholder="Your name as shown in SMS"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="campus-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="250xxxxxxxxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="campus-input"
                />
                <p className="text-xs text-muted-foreground">
                  Phone number used for the transaction
                </p>
              </div>
              
              <Button
                onClick={handlePaymentVerification}
                disabled={isVerifying}
                variant="campus"
                className="w-full text-lg py-6"
                size="lg"
              >
                {isVerifying ? "Verifying Payment..." : "Verify Payment"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;