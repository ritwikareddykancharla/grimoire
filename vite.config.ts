import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` plus hash routing lets the build run from any static host path
// (GitHub Pages project sites, Netlify, a USB stick...).
export default defineConfig({
  base: './',
  plugins: [react()],
});
