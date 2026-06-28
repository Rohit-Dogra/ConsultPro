import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import mkcert from "vite-plugin-mkcert";

const mode = process.env.NODE_ENV; // to detect 'development' mode

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173, // Use port 5173 as you mentioned
    host: true, // Listen on all network interfaces
    https: false, // Disable HTTPS for now to avoid SSL errors
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['lucide-react']
  },
  optimizeDeps: {
    include: ['lucide-react']
  }
  ,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        // remove specific console calls
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // optionally remove debugger statements
        drop_debugger: true
      },
      format: {
        comments: false
      }
    }
  }
});

