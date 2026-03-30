import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import webpush from 'web-push';

export default async function handler(req: VercelRequest, res: VercelResponse) {  
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@dailyroutine.test',
      process.env.VITE_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    );
  } catch (err: any) {
    console.error('VAPID Setup Error:', err);
    return res.status(200).json({ success: false, error: 'VAPID Setup Error', details: err.message });
  }

  const now = new Date();
  // 한국 시간(KST) 보정 
  now.setHours(now.getHours() + 9);
  
  const currentDay = now.getDay();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  try {
    let cursor: string | number = 0;
    const notificationsToSend: Promise<any>[] = [];
    let scannedKeys = 0;

    // Vercel KV 스캔 시작
    do {
      const scanResult: any = await kv.scan(cursor, { match: 'sub:*', count: 100 });
      let nextCursor;
      let keys: string[];

      if (Array.isArray(scanResult)) {
        nextCursor = scanResult[0];
        keys = scanResult[1];
      } else if (scanResult && typeof scanResult === 'object') {
        nextCursor = scanResult.cursor;
        keys = scanResult.keys || scanResult.elements || [];
      } else {
        throw new Error('Unexpected kv.scan result format');
      }

      cursor = nextCursor;
      
      if (keys && keys.length > 0) {
        scannedKeys += keys.length;
        const usersData = await kv.mget(...keys);
        
        usersData.forEach((data: any, index) => {
          if (!data || !data.routines || !data.subscription) return;
          
          data.routines.forEach((routine: any) => {
            if (routine.isActive && routine.days.includes(currentDay) && routine.time === currentTime) {
              const payload = JSON.stringify({
                title: '🔥 잊지 마세요!',
                body: `지금 [${routine.title}] 시작할 시간입니다!`,
                icon: '/pwa-192x192.png',
                badge: '/mask-icon.svg',
                vibrate: [200, 100, 200]
              });
              
              const subKey = keys[index];
              const pushPromise = async () => {
                try {
                  await webpush.sendNotification(data.subscription, payload);
                } catch (err: any) {
                  if (err.statusCode === 404 || err.statusCode === 410) {
                    console.log('Subscription expired, deleting', subKey);
                    await kv.del(subKey);
                  } else {
                    console.error('Push error for', subKey, ':', err);
                  }
                }
              };
              
              notificationsToSend.push(pushPromise());
            }
          });
        });
      }
    } while (cursor !== 0 && cursor !== '0');

    // Timeout 방어를 위해 Promise.allSettled를 사용해 병렬 발송 안정성 증가
    const results = await Promise.allSettled(notificationsToSend);
    const sentCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    return res.status(200).json({ 
      success: true, 
      sentCount, 
      failedCount, 
      scannedKeys, 
      time: currentTime 
    });
  } catch (error: any) {
    console.error('Push Job Error:', error);
    return res.status(200).json({ success: false, error: 'Push Job Error', details: error.message });
  }
}
