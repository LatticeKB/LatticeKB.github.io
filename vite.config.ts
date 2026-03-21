import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@blocknote')) {
            return 'blocknote';
          }

          if (id.includes('@tiptap') || id.includes('prosemirror')) {
            return 'editor-core';
          }

          if (id.includes('@mantine')) {
            return 'mantine';
          }

          if (id.includes('react') || id.includes('scheduler')) {
            return 'react-vendor';
          }

          if (id.includes('minisearch') || id.includes('lucide-react')) {
            return 'workspace-vendor';
          }

          return undefined;
        },
      },
    },
  },
});
