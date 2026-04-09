import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "./contexts/UserContext";
import { CustomToasterProvider } from "./contexts/CustomToasterContext";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <UserProvider>
                <CustomToasterProvider>
                    <TooltipProvider>
                        <App />
                    </TooltipProvider>
                </CustomToasterProvider>
            </UserProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

