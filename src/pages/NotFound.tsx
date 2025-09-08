import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="campus-card max-w-md w-full text-center animate-fade-in">
        <CardHeader>
          <div className="text-6xl mb-4">🍿</div>
          <CardTitle className="text-4xl font-bold text-primary">404</CardTitle>
          <CardDescription className="text-lg">
            Oops! This page seems to have popped away
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist. Maybe it's time for some fresh popcorn instead?
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = "/"}
              variant="campus"
              className="w-full"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at{" "}
              <span className="font-semibold text-accent">+250 799 373 524</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
