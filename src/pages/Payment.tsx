import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { fetchSettingsMap } from "@/lib/settings";
import { uploadPaymentProof } from "@/lib/storage";
import PaymentProofUpload from "@/components/PaymentProofUpload";

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
  const [customerName, setCustomerName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // MoMo details pulled from settings (fallback to env if missing)
  const envMomo = (import.meta as any).env?.VITE_MOMO_CODE ?? "*182*81*12345#";
  const envMerchant = (import.meta as any).env?.VITE_MERCHANT_NAME ?? "Campus Popcorn Ltd";
  const [momoCode, setMomoCode] = useState(envMomo);
  const [merchantName, setMerchantName] = useState(envMerchant);

  useEffect(() => {
    // load dynamic settings for momo code and merchant name
    (async () => {
      const map = await fetchSettingsMap();
      const code = map["momo_code"];
      const merchant = map["merchant_name"];
      if (code) setMomoCode(code);
      if (merchant) setMerchantName(merchant);
    })();

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

  const handleCompleteOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your name to complete the order.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Missing Payment Proof",
        description: "Please upload your payment proof to complete the order.",
        variant: "destructive",
      });
      return;
    }

    if (!orderDetails?.orderId) {
      toast({ 
        title: "Order Missing", 
        description: "Could not find order reference. Please restart your order.", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload payment proof file
      const { url: paymentProofUrl } = await uploadPaymentProof(
        selectedFile,
        orderDetails.orderId.toString(),
        user?.id
      );

      // Update order with payment proof and customer name
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ 
          payment_proof_url: paymentProofUrl,
          customer_name: customerName.trim(),
          payment_proof_uploaded_at: new Date().toISOString(),
          payment_status: "pending", // Set to pending for admin review
          status: "pending" 
        })
        .eq("id", orderDetails.orderId);
        
      if (orderUpdateError) throw orderUpdateError;
      
      setPaymentCompleted(true);
      localStorage.removeItem("currentOrder");
      
      toast({
        title: "Order Submitted! 📄",
        description: "Your payment proof has been uploaded. We'll review and confirm your order shortly.",
      });
        
    } catch (error: any) {
      console.error("Order completion error:", error);
      toast({
        title: "Upload Error",
        description: error?.message || "An error occurred while uploading your payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
            <CardTitle className="text-2xl text-green-600">Order Submitted!</CardTitle>
            <CardDescription>Your payment proof has been uploaded for review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Order Details:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Portions:</span> {orderDetails.portions}</p>
                <p><span className="text-muted-foreground">Location:</span> {orderDetails.location}</p>
                <p><span className="text-muted-foreground">Total:</span> {orderDetails.totalPrice.toLocaleString()} RWF</p>
                <p><span className="text-muted-foreground">Status:</span> Pending Review</p>
              </div>
            </div>
            
            <div className="bg-accent-light rounded-lg p-4">
              <p className="text-sm font-medium text-accent-foreground mb-2">
                📋 Payment proof uploaded!
              </p>
              <p className="text-xs text-muted-foreground">
                Our team will review your payment and confirm your order shortly.
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
          
          <h1 className="text-3xl font-bold mb-2">Complete Your Order</h1>
          <p className="text-muted-foreground">
            Upload your payment proof to complete your order
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

          {/* Payment Proof Upload */}
          <PaymentProofUpload
            onFileSelect={setSelectedFile}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            isUploading={isUploading}
            selectedFile={selectedFile}
            disabled={isUploading}
          />

          {/* Complete Order Button */}
          <Card className="campus-card animate-slide-up">
            <CardContent className="pt-6">
              <Button
                onClick={handleCompleteOrder}
                disabled={isUploading || !selectedFile || !customerName.trim()}
                variant="campus"
                className="w-full text-lg py-6"
                size="lg"
              >
                {isUploading ? "Uploading Payment Proof..." : "Complete Order"}
              </Button>
              
              {(!selectedFile || !customerName.trim()) && (
                <p className="text-sm text-muted-foreground text-center mt-3">
                  Please fill in all required fields to complete your order
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payment;