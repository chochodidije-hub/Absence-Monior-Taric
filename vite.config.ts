import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // هذا السطر يمنع التعليق اللانهائي
    minify: false, 
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html',
        teacher: './teacher.html',
      },
    },
  },
});