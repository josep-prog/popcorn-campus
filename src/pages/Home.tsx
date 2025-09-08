import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-popcorn.jpg";

const Home = () => {
  const navigate = useNavigate();
  const [serviceStatus] = useState<"open" | "closed">("open"); // This would come from backend

  const handleStartOrder = () => {
    if (serviceStatus === "closed") {
      toast({
        title: "Service Closed",
        description: "Campus Popcorn is currently closed. Please check back during service hours.",
        variant: "destructive",
      });
      return;
    }
    navigate("/order");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Fresh golden popcorn on campus" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary/40 to-accent/40 backdrop-blur-sm"></div>
        </div>
        <div className="relative mx-auto max-w-4xl text-center z-10">
          <div className="mb-6 flex justify-center">
            <Badge 
              variant={serviceStatus === "open" ? "default" : "destructive"}
              className="text-lg px-6 py-2 animate-fade-in"
            >
              {serviceStatus === "open" ? "🍿 Service Open" : "⏰ Service Closed"}
            </Badge>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground animate-fade-in">
            Campus Popcorn
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up">
            Fresh popcorn delivered straight to your campus location in just 5 minutes. 
            Order now with secure MoMo payments.
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center animate-slide-up">
              <Button 
                onClick={handleStartOrder}
                size="lg"
                variant="campus"
                className="px-8 py-6 text-lg rounded-full"
                disabled={serviceStatus === "closed"}
              >
              <Zap className="mr-2 h-5 w-5" />
              Start Your Order
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={() => navigate("/login")}
              className="px-8 py-6 text-lg rounded-full bg-card/50 backdrop-blur-sm"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Campus Popcorn?</h2>
            <p className="text-muted-foreground text-lg">Fast, reliable, and convenient snack delivery</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="campus-card animate-fade-in">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>5-Minute Delivery</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Lightning-fast delivery to any campus location. Your fresh popcorn arrives hot and ready.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="campus-card animate-fade-in">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Campus Locations</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  We know every classroom and pod on campus. Just select your location from our list.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="campus-card animate-fade-in">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Secure MoMo Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base">
                  Pay safely with MTN Mobile Money. Instant verification and email confirmations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-20 px-4 bg-muted/30">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-8">Simple Pricing</h2>
          
          <Card className="campus-card max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Fresh Popcorn</CardTitle>
              <div className="text-4xl font-bold text-primary">1,500 RWF</div>
              <CardDescription>per portion</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">✓ Fresh, hot popcorn</p>
                <p className="text-sm text-muted-foreground">✓ 5-minute delivery</p>
                <p className="text-sm text-muted-foreground">✓ Any campus location</p>
                <p className="text-sm text-muted-foreground">✓ Email confirmation</p>
              </div>
              
                <Button 
                  onClick={handleStartOrder}
                  variant="campus"
                  className="w-full"
                  disabled={serviceStatus === "closed"}
                >
                Order Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-12 px-4 border-t">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-muted-foreground mb-4">
            Need help? Contact our support team
          </p>
          <p className="font-semibold text-accent">
            📞 +250 799 373 524
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;