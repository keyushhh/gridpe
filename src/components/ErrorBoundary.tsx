import { ASSETS } from '@/constants/assets';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleRestart = () => {
    // Hard reset — same pattern as useAuth logout
    window.location.replace('/');
  };

  private getIsDark = (): boolean => {
    // Class components can't use hooks, so we check:
    // 1. localStorage theme preference (set by next-themes)
    // 2. System preference as fallback
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('theme');
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  public render() {
    if (this.state.hasError) {
      const isDark = this.getIsDark();

      return (
        <div
          className="flex flex-col items-center justify-center min-h-screen w-full p-6 text-center"
          style={{ backgroundColor: isDark ? '#0a0a12' : '#FFFFFF' }}
        >
          <div className="mb-8 animate-fade-in">
            <img
              src={ASSETS.GRIDPE_LOGO}
              alt="Grid.Pe"
              className="w-20 h-20 mb-6 mx-auto"
              style={{ filter: isDark ? 'none' : 'invert(1)' }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: isDark ? '#FFFFFF' : '#000000' }}
            >
              Something went wrong
            </h1>
            <p
              className="mb-8 max-w-[280px] mx-auto text-base leading-relaxed"
              style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
            >
              We encountered an unexpected glitch. Our engineers have been notified.
            </p>
          </div>
          <Button
            onClick={this.handleRestart}
            className="w-full max-w-[280px] h-14 text-lg font-bold rounded-2xl bg-[#5260FE] hover:bg-[#4350E0] text-white shadow-[0_8px_16px_rgba(82,96,254,0.3)] transition-all active:scale-95"
          >
            Restart App
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
