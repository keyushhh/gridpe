import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const removeCrossorigin = () => ({
  name: 'remove-crossorigin',
  transformIndexHtml(html: string) {
    // Only remove crossorigin from link tags, not script tags
    return html.replace(/<link([^>]*)\scrossorigin(?:="[^"]*")?([^>]*)>/g, '<link$1$2>');
  }
});

export default defineConfig(({ mode }) => ({
  base: "./",
  assetsInclude: ['**/*.lottie'],
  server: {
    host: "::",
    port: 8080,
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'esnext',
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        manualChunks(id) {
          // Map rendering — isolated, largest chunk
          if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
            return 'map-engine';
          }
          // Supabase client — large, rarely changes
          if (id.includes('@supabase/')) {
            return 'vendor-supabase';
          }
          // React core + router — must load first
          if (id.includes('react-router-dom') || id.includes('react-router/') ||
              id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Animation — framer-motion is heavy
          if (id.includes('framer-motion')) {
            return 'vendor-animation';
          }
          // Data fetching
          if (id.includes('@tanstack/')) {
            return 'vendor-query';
          }
          // Capacitor plugins — mobile runtime
          if (id.includes('@capacitor/')) {
            return 'vendor-capacitor';
          }
          // Analytics — posthog is large, load after paint
          if (id.includes('posthog-js')) {
            return 'vendor-analytics';
          }
          // Lottie animation runtime
          if (id.includes('lottie-web') || id.includes('@lottiefiles/')) {
            return 'vendor-lottie';
          }
          // OCR engine — only used on CameraPage (lazy loaded)
          if (id.includes('tesseract')) {
            return 'vendor-ocr';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'vendor-dates';
          }
          // Remaining node_modules — catchall vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        }
      },
    },
  },
  plugins: [
    react(),
    removeCrossorigin(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));