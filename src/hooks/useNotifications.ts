import { useEffect, useRef } from 'react';
import { useRoutine } from '../context/RoutineContext';

export function useNotifications() {
  const { routines } = useRoutine();
  const notifiedSet = useRef<Set<string>>(new Set());

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Optional: Ready for iOS Safari Background Web Push (Requires Backend)
        subscribeToWebPush();
      }
    }
  };

  // Fetch exact VAPID token from env (or window.env during build)
  const subscribeToWebPush = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY; 
        if (!vapidPublicKey) {
          console.error("VAPID URL is missing in environment variables.");
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        // Initial sync
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, routines })
        });
      } catch (e) {
        console.error('Failed to subscribe to Web Push:', e);
      }
    }
  };

  // Helper to convert VAPID keys
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Auto-sync backend whenever user edits routines
  useEffect(() => {
    const syncBackend = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await fetch('/api/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription, routines })
            });
          }
        } catch (e) {
          console.error('Failed to auto-sync backend', e);
        }
      }
    };
    syncBackend();
  }, [routines]);

  useEffect(() => {
    const checkRoutines = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const now = new Date();
      const currentDay = now.getDay();
      
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const dateString = now.toISOString().split('T')[0];

      routines.forEach(routine => {
        if (!routine.isActive || !routine.days.includes(currentDay)) return;

        if (routine.time === currentTime) {
          const notificationKey = `${routine.id}_${dateString}_${currentTime}`;
          
          if (!notifiedSet.current.has(notificationKey)) {
            // iOS Standard: Must use serviceWorker registration to show local notifications
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('🔥 잊지 마세요!', {
                  body: `지금 [${routine.title}] 시작할 시간입니다!`,
                  icon: '/pwa-192x192.png',
                  badge: '/mask-icon.svg',
                  vibrate: [200, 100, 200]
                } as any);
              });
            } else {
              new Notification('🔥 잊지 마세요!', {
                body: `지금 [${routine.title}] 시작할 시간입니다!`,
                icon: '/pwa-192x192.png',
              });
            }
            notifiedSet.current.add(notificationKey);
          }
        }
      });
    };

    const intervalId = setInterval(checkRoutines, 10000); // Check every 10 seconds
    checkRoutines();

    return () => clearInterval(intervalId);
  }, [routines]);

  return { requestPermission };
}
