import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus, MapPin, Package, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

// ALU Campus locations (African countries)
const campusLocations = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso",
  "Burundi", "Cameroon", "Cape Verde", "Chad", "Comoros",
  "Congo", "Côte d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea",
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho",
  "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
  "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
  "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", "Senegal",
  "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan",
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
];

const Order = () => {
  const navigate = useNavigate();
  const [portions, setPortions] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [customLocation, setCustomLocation] = useState("");
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  const pricePerPortion = 1500;
  const totalPrice = portions * pricePerPortion;

  const handlePortionChange = (change: number) => {
    const newPortions = Math.max(1, Math.min(10, portions + change));
    setPortions(newPortions);
  };

  const handleLocationChange = (value: string) => {
    if (value === "custom") {
      setIsCustomLocation(true);
      setSelectedLocation("");
    } else {
      setIsCustomLocation(false);
      setSelectedLocation(value);
      setCustomLocation("");
    }
  };

  const handleProceedToPayment = async () => {
    const location = isCustomLocation ? customLocation : selectedLocation;
    
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please select or enter your delivery location.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: userResult } = await supabase.auth.getUser();
      const userId = userResult.user?.id || null;
      const userEmail = userResult.user?.email || null;

      // Create order in Supabase
      const { data: inserted, error } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          email: userEmail,
          portions,
          location: location.trim(),
          total_price: totalPrice,
          status: "pending",
          payment_status: "pending",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      const orderId = inserted?.id as string | number | undefined;

      // Store order details locally for the payment page
      const orderDetails = {
        orderId,
        portions,
        location: location.trim(),
        totalPrice,
        timestamp: Date.now(),
      };
      
      localStorage.setItem("currentOrder", JSON.stringify(orderDetails));
      navigate("/payment");
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Order creation error:", e);
      toast({ title: "Order Error", description: e?.message || "Unable to create order. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Place Your Order</h1>
          <p className="text-muted-foreground">
            Choose your portions and delivery location
          </p>
        </div>

        <div className="space-y-6">
          {/* Portion Selection */}
          <Card className="campus-card animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Popcorn Portions
              </CardTitle>
              <CardDescription>
                Each portion is 1,500 RWF - fresh, hot, and delicious!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Label className="text-base">Number of Portions</Label>
                  <p className="text-sm text-muted-foreground">Maximum 10 portions per order</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePortionChange(-1)}
                    disabled={portions <= 1}
                    className="campus-input"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-2xl font-bold w-12 text-center">
                    {portions}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePortionChange(1)}
                    disabled={portions >= 10}
                    className="campus-input"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Selection */}
          <Card className="campus-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Location
              </CardTitle>
              <CardDescription>
                Select your campus location or enter a custom location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Campus Location</Label>
                <Select onValueChange={handleLocationChange}>
                  <SelectTrigger className="campus-input">
                    <SelectValue placeholder="Select your location..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {campusLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">📍 Custom Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCustomLocation && (
                <div className="space-y-2 animate-slide-up">
                  <Label htmlFor="customLocation">Custom Location</Label>
                  <Input
                    id="customLocation"
                    placeholder="Enter your specific location..."
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="campus-input"
                  />
                  <p className="text-sm text-muted-foreground">
                    Please be as specific as possible to ensure accurate delivery
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="campus-card animate-slide-up">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {portions} portion{portions > 1 ? "s" : ""} × 1,500 RWF
                  </span>
                  <span className="font-semibold">{totalPrice.toLocaleString()} RWF</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{totalPrice.toLocaleString()} RWF</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleProceedToPayment}
                    variant="campus"
                    className="w-full text-lg py-6"
                    size="lg"
                  >
                    Proceed to Payment
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  🕐 Estimated delivery time: 5 minutes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Order;