import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/groq': {
            target: 'https://api.groq.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/groq/, ''),
            configure: (proxy, _options) => {
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                // Remove all headers first to avoid "Request Header Fields Too Large"
                proxyReq.removeHeader('cookie');
                proxyReq.removeHeader('set-cookie');
                
                // Only forward essential headers
                if (req.headers.authorization) {
                  proxyReq.setHeader('Authorization', req.headers.authorization);
                }
                if (req.headers['content-type']) {
                  proxyReq.setHeader('Content-Type', req.headers['content-type']);
                }
                // Set minimal headers
                proxyReq.setHeader('User-Agent', 'WiqayaX/1.0');
              });
            },
          },
        },
      },
      plugins: [react()],
      define: {
        // Optional: Only define if env vars exist (users provide their own API keys)
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
