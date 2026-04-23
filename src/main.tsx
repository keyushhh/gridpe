import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "./contexts/UserContext";
import { CustomToasterProvider } from "./contexts/CustomToasterContext";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

// Global error handler for native bridge/WebView debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled Rejection:', event.reason);
};

try {
  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <UserProvider>
            <CustomToasterProvider>
              <App />
            </CustomToasterProvider>
          </UserProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
} catch (error) {
  console.error('CRITICAL: App failed to initialize:', error);
}
