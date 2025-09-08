import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPromptTest = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    console.log('PWA Install Prompt Test: Component mounted');
    
    // Always show for testing (remove this in production)
    setTimeout(() => {
      console.log('PWA Install Prompt Test: Force showing for testing');
      setShowInstallPrompt(true);
    }, 2000);

    // Check if app is already installed
    const checkInstallStatus = () => {
      console.log('PWA Install Prompt Test: Checking install status...');
      
      // Check if running in standalone mode (installed)
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true) {
        console.log('PWA Install Prompt Test: App is already installed (standalone mode)');
        setIsInstalled(true);
        setIsStandalone(true);
        return;
      }

      // Check if it's iOS
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(iOS);
      console.log('PWA Install Prompt Test: iOS detected:', iOS);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Install Prompt Test: beforeinstallprompt event received');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA Install Prompt Test: App installed event received');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    checkInstallStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('PWA Install Prompt Test: Install button clicked');
    
    if (deferredPrompt) {
      console.log('PWA Install Prompt Test: Showing native install prompt');
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA Install Prompt Test: User accepted the install prompt');
      } else {
        console.log('PWA Install Prompt Test: User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    console.log('PWA Install Prompt Test: Dismiss button clicked');
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleIOSInstructions = () => {
    console.log('PWA Install Prompt Test: iOS instructions clicked');
    alert('To install this app on your iPhone:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Debug logging
  console.log('PWA Install Prompt Test Render Check:', {
    isInstalled,
    isStandalone,
    showInstallPrompt,
    deferredPrompt: !!deferredPrompt,
    isIOS
  });

  if (isInstalled || isStandalone) {
    console.log('PWA Install Prompt Test: Not rendering because app is installed');
    return null;
  }

  if (!showInstallPrompt) {
    console.log('PWA Install Prompt Test: Not rendering because showInstallPrompt is false');
    return null;
  }

  console.log('PWA Install Prompt Test: Rendering install prompt');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 border-t-2 border-yellow-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Install Campus Popcorn</h3>
              <p className="text-white/90 text-sm">Get the app for offline access & notifications</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {deferredPrompt ? (
              <Button 
                onClick={handleInstallClick}
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-6 py-2 rounded-full shadow-lg"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Install Now
              </Button>
            ) : isIOS ? (
              <Button 
                onClick={handleIOSInstructions}
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-6 py-2 rounded-full shadow-lg"
                size="sm"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Install
              </Button>
            ) : (
              <Button 
                onClick={handleDismiss}
                className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-6 py-2 rounded-full shadow-lg"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPromptTest;
