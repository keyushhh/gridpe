import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { crashlytics } from '@/lib/crashlytics';

interface Props extends React.PropsWithChildren {
  route?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    crashlytics.recordError(error, 'ErrorBoundary');
    logger.error(error, {
      route: this.props.route || window.location.pathname,
      componentStack: info.componentStack
    });
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const isDarkMode = (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) || 
                     (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const navigate = useNavigate();
  
  const primaryColor = '#5260FE';
  const bgColor = isDarkMode ? '#0A0A12' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#0A0A12';
  const subtextColor = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(10,10,18,0.45)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: bgColor,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '430px',
          padding: '0 24px',
          marginTop: '-40px',
        }}
      >
        <DotLottieReact
          src="https://lottie.host/b7a68356-b7e4-4e05-a939-ff1b224650d6/CJBuGIhVa0.lottie"
          loop
          autoplay
          style={{ width: 200, height: 200 }}
        />
        
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 600,
            letterSpacing: '-0.5px',
            color: textColor,
            marginTop: '8px',
            marginBottom: '8px',
            fontFamily: 'Satoshi, sans-serif',
          }}
        >
          Something went wrong
        </h1>
        
        <p
          style={{
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1.65,
            color: subtextColor,
            maxWidth: '260px',
            textAlign: 'center',
            marginBottom: '32px',
            fontFamily: 'Satoshi, sans-serif',
          }}
        >
          We hit an unexpected error. This has been noted and we're on it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button
            onClick={onReset}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '100px',
              backgroundColor: primaryColor,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '15px',
              border: 'none',
              fontFamily: 'Satoshi, sans-serif',
              cursor: 'pointer',
              transition: 'filter 0.15s ease',
            }}
            onPointerDown={(e) => { e.currentTarget.style.filter = 'brightness(0.85)'; }}
            onPointerUp={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
            onPointerLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            Try again
          </button>
          
          <button
            onClick={() => navigate(-1)}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '100px',
              backgroundColor: 'transparent',
              color: textColor,
              fontWeight: 600,
              fontSize: '15px',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              fontFamily: 'Satoshi, sans-serif',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onPointerDown={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }}
            onPointerUp={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            onPointerLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export const RouteErrorBoundary = () => {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname} route={location.pathname}>
      <Outlet />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
