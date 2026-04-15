import React, { useEffect, useState } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { WifiOff, Wifi } from 'lucide-react';

const NetworkBanner: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    // Initial status check
    Network.getStatus().then((s) => {
      setStatus(s);
    });

    // Listen for changes
    const handler = Network.addListener('networkStatusChange', (s) => {
      setStatus((prev) => {
        if (prev && !prev.connected && s.connected) {
          // We were offline and are now online
          setShowBackOnline(true);
          setTimeout(() => {
            setShowBackOnline(false);
          }, 3000); // 3 seconds total including animation
        }
        return s;
      });
    });

    return () => {
      handler.remove();
    };
  }, []);

  if (!status) return null;

  const isOffline = !status.connected;
  const isVisible = isOffline || showBackOnline;

  return (
    <div
      className={`fixed left-0 right-0 z-[9998] transition-all duration-500 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      style={{
        bottom: 'calc(64px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="px-4 py-2">
        <div
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md ${
            isOffline ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">No internet connection</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Back online</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkBanner;
