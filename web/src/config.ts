export const config = {
  // VITE_API is set in vite.config.js (dev: localhost:3001, production build: /api)
  apiBaseUrl: import.meta.env.VITE_API || '/api',
};
