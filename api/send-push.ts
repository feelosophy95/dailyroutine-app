import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import * as webpush from 'web-push';

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

  const now = new Date();
  
  // 한국 시간(KST) 보정 (Vercel Edge/Serverless는 기본적으로 UTC)
  now.setHours(now.getHours() + 9);
  
  const currentDay = now.getDay();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  try {
    let cursor: string | number = 0;
    const notificationsToSend: Promise<any>[] = [];
    let scannedKeys = 0;

    // Vercel KV에서 접속 가능한 모든 유저 구독 데이터를 스캔
    do {
      const scanResult: any = await kv.scan(cursor, { match: 'sub:*', count: 100 });
      let nextCursor;
      let keys: string[];

      // Handle both [cursor, keys] and { cursor, keys } formats depending on @upstash/redis version
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
          if (!data || !data.routines) return;
          
          data.routines.forEach((routine: any) => {
            // 해당 요일, 시간이 일치하는지 체크
            if (routine.isActive && routine.days.includes(currentDay) && routine.time === currentTime) {
              const payload = JSON.stringify({
                title: '🔥 잊지 마세요!',
                body: `지금 [${routine.title}] 시작할 시간입니다!`,
                icon: '/pwa-192x192.png',
                badge: '/mask-icon.svg',
                vibrate: [200, 100, 200]
              });
              
              const subKey = keys[index];
              notificationsToSend.push(
                webpush.sendNotification(data.subscription, payload)
                  .catch(err => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                      // 구독자 만료 시 데이터베이스 자동 삭제
                      console.log('Subscription expired, deleting', subKey);
                      return kv.del(subKey);
                    } else {
                      console.error('Push error:', err);
                    }
                  })
              );
            }
          });
        });
      }
    } while (cursor !== 0 && cursor !== '0');

    // 모아둔 모든 푸시 알림 병렬 발송
    await Promise.all(notificationsToSend);

    return res.status(200).json({ success: true, sentCount: notificationsToSend.length, scannedKeys, time: currentTime });
  } catch (error: any) {
    console.error('Push Job Error:', error);
    // 500으로 하면 cron-job이 에러만 보여주므로 200으로 반환하고 에러내용을 담음
    return res.status(200).json({ success: false, error: 'Push Job Error', details: error.message, stack: error.stack });
  }
}
