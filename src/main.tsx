import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RoutineProvider } from './context/RoutineContext'

// Aggressively unregister old service workers to fix the "black screen" PWA caching issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  
  if (window.caches) {
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => caches.delete(key)));
    });
  }
}

console.log("main.tsx executing! Bootstrapping React...");

try {
  const rootElement = document.getElementById('root');
  console.log("Root element found:", rootElement);
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <RoutineProvider>
          <App />
        </RoutineProvider>
      </StrictMode>,
    );
    console.log("React render called successfully!");
  } else {
    console.error("CRITICAL: #root element NOT FOUND!");
  }
} catch (error) {
  console.error("CRITICAL ERROR DURING MOUNT:", error);
}
