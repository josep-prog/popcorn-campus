import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

const SimpleInstallPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    console.log('SimpleInstallPrompt: Component mounted');
    
    // Always show after 3 seconds for testing
    const timer = setTimeout(() => {
      console.log('SimpleInstallPrompt: Showing prompt');
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = () => {
    console.log('SimpleInstallPrompt: Install clicked');
    alert('Install functionality would work here!');
  };

  const handleDismiss = () => {
    console.log('SimpleInstallPrompt: Dismissed');
    setShow(false);
  };

  if (!show) {
    console.log('SimpleInstallPrompt: Not showing yet');
    return null;
  }

  console.log('SimpleInstallPrompt: Rendering prompt');

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
            <Button 
              onClick={handleInstall}
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-6 py-2 rounded-full shadow-lg"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
            
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

export default SimpleInstallPrompt;
