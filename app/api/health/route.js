import { Redis } from '@upstash/redis';

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ── データを受け取る（ショートカットからPOST）──────────
export async function POST(request) {
  try {
    const body = await request.json();
    const { steps, sleep, heartRate } = body;

    // バリデーション
    if (steps === undefined && sleep === undefined && heartRate === undefined) {
      return Response.json({ error: 'データがありません' }, { status: 400 });
    }

    // 今日の日付をキーにして保存
    const today = new Date().toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).replace(/\//g, '-');

    const data = {
      steps:     Number(steps)     || 0,
      sleep:     Number(sleep)     || 0,
      heartRate: Number(heartRate) || 0,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`health:${today}`, JSON.stringify(data));

    return Response.json({ success: true, date: today, data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── データを取得する（Magic PortのUIがGET）─────────────
export async function GET() {
  try {
    const today = new Date().toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).replace(/\//g, '-');

    const raw = await redis.get(`health:${today}`);

    if (!raw) {
      // 今日のデータがまだない場合はダミーを返す
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
