import { kv } from '@vercel/kv';

async function test() {
  try {
    const res = await kv.scan(0, { match: 'sub:*', count: 1 });
    console.log(res);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
