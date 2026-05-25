import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeFromNotification } from '../utils/notificationRouter';

export function InAppNotificationBanner() {
  const [notification, setNotification] = useState<{title: string, body: string, data: any} | null>(null);
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    const handleReceived = (event: Event) => {
      const customEvent = event as CustomEvent;
      setNotification(customEvent.detail);
      
      // Auto-dismiss after 4 seconds
      const t = setTimeout(() => {
        setNotification(current => 
          current === customEvent.detail ? null : current
        );
      }, 4000);
      if (false) clearTimeout(t);
    };

    window.addEventListener('notification-received', handleReceived);
    return () => {
      window.removeEventListener('notification-received', handleReceived);
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  if (!notification) return null;

  let touchStartY = 0;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touchY = e.touches[0].clientY;
    if (touchStartY - touchY > 40) {
      setNotification(null);
    }
  };

  const handleTap = () => {
    routeFromNotification(notification.data, navigate);
    setNotification(null);
  };

  return (
    <div
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top) + 8px)',
        left: '50%',
        transform: 'translateX(-50%) translateY(0)',
        width: 'calc(100% - 32px)',
        maxWidth: '430px',
        backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.96)' : 'rgba(250, 250, 252, 0.96)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: isDarkMode ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.06)',
        padding: '12px 16px',
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        animation: 'slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)'
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-120%); }
          to { transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        backgroundColor: isDarkMode ? '#333' : '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '20px',
        color: isDarkMode ? '#fff' : '#000',
        flexShrink: 0
      }}>
        G
      </div>
      <div style={{ flex: 1, margin: '0 10px', overflow: 'hidden' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: isDarkMode ? '#FFFFFF' : '#1C1C1E',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {notification.title}
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: 400,
          color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(28,28,30,0.55)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {notification.body}
        </div>
      </div>
      <div style={{
        fontSize: '11px',
        color: isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(28,28,30,0.3)',
        whiteSpace: 'nowrap',
        alignSelf: 'flex-start',
        marginTop: '2px'
      }}>
        now
      </div>
    </div>
  );
}
