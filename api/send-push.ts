import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  process.env.VITE_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {  
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

    // Vercel KV에서 접속 가능한 모든 유저 구독 데이터를 스캔
    do {
      const [nextCursor, keys] = await kv.scan(cursor, { match: 'sub:*', count: 100 });
      cursor = nextCursor;
      
      if (keys.length > 0) {
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
              
              notificationsToSend.push(
                webpush.sendNotification(data.subscription, payload)
                  .catch(err => {
                    if (err.statusCode === 404 || err.statusCode === 410) {
                      // 구독자 만료 시 데이터베이스 자동 삭제
                      console.log('Subscription expired, deleting', keys[index]);
                      return kv.del(keys[index]);
                    } else {
                      console.error('Push error:', err);
                    }
                  })
              );
            }
          });
        });
      }
    } while (cursor !== 0);

    // 모아둔 모든 푸시 알림 병렬 발송
    await Promise.all(notificationsToSend);

    res.status(200).json({ success: true, sentCount: notificationsToSend.length, time: currentTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send push notifications' });
  }
}
