import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { profile } from './app/profile.ts';
import { defineConfig } from 'vite';

// Static export: Cloudflare Pages serves the generated files without a Worker.
export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  plugins: [
    react(),
    {
      name: 'profile-metadata',
      transformIndexHtml(html) {
        const escape = (value: string) =>
          value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
        return html
          .replace('__TITLE__', escape(`${profile.name} / ${profile.siteName}`))
          .replace('__DESCRIPTION__', escape(profile.bio));
      },
    },
  ],
});
