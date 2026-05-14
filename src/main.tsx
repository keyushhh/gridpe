import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserProvider } from './contexts/UserContext';
import { CustomToasterProvider } from './contexts/CustomToasterContext';
import App from './App.tsx';
import './index.css';
import { Capacitor } from '@capacitor/core';

if (Capacitor.getPlatform() === 'android') {
  document.body.classList.add('android-platform');
}

if (Capacitor.getPlatform() === 'web') {
  document.documentElement.classList.add('web-platform');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevents excessive refetching on mobile multitask switch
    },
  },
});

// Block paint until Satoshi is ready so glyphs like ₹ don't fall back to a
// system font that lacks the codepoint. Capped so a slow CDN can't hang launch.
document.documentElement.classList.add('font-pending');
const releaseFont = () => document.documentElement.classList.remove('font-pending');
if ('fonts' in document) {
  Promise.race([
    document.fonts.load('500 16px "Satoshi"').then(() => document.fonts.ready),
    new Promise(resolve => setTimeout(resolve, 1500)),
  ]).finally(releaseFont);
} else {
  setTimeout(releaseFont, 0);
}

// Global error handler for native bridge/WebView debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = event => {
  console.error('Unhandled Rejection:', event.reason);
};

// Immediately apply theme to prevent flash
(function() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark' || (!theme && true)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

try {
  createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        disableTransitionOnChange
      >
        <TooltipProvider>
          <CustomToasterProvider>
            <UserProvider>
              <App />
            </UserProvider>
          </CustomToasterProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} catch (error) {
  console.error('CRITICAL: App failed to initialize:', error);
}
