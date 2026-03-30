import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import webpush from 'web-push';

export default async function handler(req: VercelRequest, res: VercelResponse) {  
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
      process.env.VITE_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    );
  } catch (err: any) {
    console.error('VAPID Setup Error:', err);
    return res.status(200).json({ success: false, error: 'VAPID Setup Error', details: err.message });
  }

  try {
    let cursor: string | number = 0;
    const notificationsToSend: Promise<any>[] = [];
    let scannedKeys = 0;

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
          if (!data || !data.subscription) return;
          
          const payload = JSON.stringify({
            title: '🔥 테스트 알림!',
            body: `아이폰 잠금화면 알림 테스트입니다. 잘 오나요?`,
            icon: '/pwa-192x192.png',
            badge: '/mask-icon.svg',
            vibrate: [200, 100, 200]
          });
          
          const subKey = keys[index];
          notificationsToSend.push(
            webpush.sendNotification(data.subscription, payload)
              .catch(err => {
                if (err.statusCode === 404 || err.statusCode === 410) {
                   console.log('Subscription expired, deleting', subKey);
                   return kv.del(subKey);
                } else {
                  console.error('Push error:', err);
                }
              })
          );
        });
      }
    } while (cursor !== 0 && cursor !== '0');

    await Promise.all(notificationsToSend);

    return res.status(200).json({ success: true, sentCount: notificationsToSend.length, scannedKeys });
  } catch (error: any) {
    console.error('Test Push Error:', error);
    return res.status(200).json({ success: false, error: 'Test Push Error', details: error.message, stack: error.stack });
  }
}
