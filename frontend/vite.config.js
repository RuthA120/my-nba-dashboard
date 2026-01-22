import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'react', replacement: path.resolve('./node_modules/react') },
      { find: 'react-dom', replacement: path.resolve('./node_modules/react-dom') }
    ]
  }
});
