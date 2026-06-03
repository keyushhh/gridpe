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
          if (id.includes('maplibre-gl') || id.includes('react-map-gl')) {
            return 'map-engine';
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