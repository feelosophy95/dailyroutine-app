import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscription, routines } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  try {
    const deviceId = Buffer.from(subscription.endpoint).toString('base64').substring(0, 32); 

    // Store the subscription and user's scheduled routines to database
    await kv.set(`sub:${deviceId}`, { subscription, routines });

    res.status(200).json({ success: true, deviceId });
  } catch (error) {
    console.error('Failed to save subscription:', error);
    res.status(500).json({ error: 'Internal server error while saving' });
  }
}
