import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Do not register the app service worker during local development.
// Chrome can keep stale cached bundles and re-run an old router state.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));

      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', reg.scope);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
}
