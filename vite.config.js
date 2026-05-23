import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],server: {
        proxy: {
          // Redirigir todas las solicitudes que empiezan con '/api' a tu servidor Laravel
          '/api': 'http://127.0.0.1:8000',
        },
      },
});