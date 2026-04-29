import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

function getTodayKey() {
  return new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '-');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { steps, sleep, heartRate } = body;
    const today = getTodayKey();

    // 既存データを取得
    const raw      = await redis.get(`health:${today}`);
    const existing = raw
      ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
      : { steps: 0, sleep: 0, heartRate: 0 };

    // sleep が -1 のときは既存の睡眠データを維持
    const newData = {
      steps:     Number(steps)     ?? existing.steps,
      sleep:     sleep === -1 ? existing.sleep : (Number(sleep) ?? existing.sleep),
      heartRate: Number(heartRate) ?? existing.heartRate,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`health:${today}`, JSON.stringify(newData));
    return Response.json({ success: true, date: today, data: newData });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const today = getTodayKey();
    const raw   = await redis.get(`health:${today}`);

    if (!raw) {
      return Response.json({
        steps: 0, sleep: 0, heartRate: 0,
        updatedAt: null, isDemo: true,
      });
    }

    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Response.json({ ...data, isDemo: false });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
