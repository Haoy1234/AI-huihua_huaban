import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT || 3002);
  const devOrigin = `http://localhost:${port}`;
    return {
      server: {
        port,
        host: '0.0.0.0',
        proxy: {
          '/or': {
            target: 'https://openrouter.ai',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/or/, ''),
            secure: true,
            headers: {
              'HTTP-Referer': devOrigin,
              'X-Title': 'BananaPad AI Editor'
            }
          }
        }
      },
      plugins: [react()],
      define: {
        // 仅当配置了 VITE_GEMINI_API_KEY 时才注入，否则置空，避免把 OpenRouter 密钥误用为 Google Key
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
