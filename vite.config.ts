import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function basePath(): string {
  const env = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  if (!env.GITHUB_ACTIONS) return '/';
  const [owner, repo] = String(env.GITHUB_REPOSITORY ?? '').split('/');
  if (!repo) return '/';
  return repo.toLowerCase() === `${owner}.github.io`.toLowerCase() ? '/' : `/${repo}/`;
}

export default defineConfig({
  base: basePath(),
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: false, allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: ['.e2b.app'] },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200, rollupOptions: { output: { manualChunks: { react: ['react','react-dom','react-router-dom'], charts: ['recharts'] } } } },
});
