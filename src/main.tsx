import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key");
}

import { ThemeProvider } from "next-themes";

createRoot(document.getElementById("root")!).render(
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <App />
        </ThemeProvider>
    </ClerkProvider>
);

