import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev — swap for your analytics/Sentry later
    console.error('[ErrorBoundary caught]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} errorMessage={this.state.errorMessage} />;
    }
    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ onReset: () => void; errorMessage: string }> = ({ onReset, errorMessage }) => {
  const isDarkMode = (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) || 
                     (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
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
          Reload app
        </button>

        {((import.meta as any).env?.DEV || process.env.NODE_ENV === 'development') && errorMessage && (
          <div
            style={{
              marginTop: '16px',
              fontSize: '11px',
              opacity: 0.3,
              fontFamily: 'monospace',
              color: textColor,
              textAlign: 'center',
              wordBreak: 'break-all',
              maxWidth: '100%',
            }}
          >
            {errorMessage.substring(0, 120)}{errorMessage.length > 120 ? '...' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;
