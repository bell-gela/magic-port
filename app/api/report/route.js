export async function POST(request) {
  try {
    const { days } = await request.json();

    const summary = days.map(d => {
      if (!d.data) return `${d.date}：データなし`;
      const hp = Math.round(
        Math.min(d.data.steps / 8000, 1) * 40 +
        Math.min(d.data.sleep / 7,    1) * 40 +
        (d.data.heartRate < 80 ? 20 : d.data.heartRate < 90 ? 10 : 0)
      );
      return `${d.date}：歩数${d.data.steps}歩・睡眠${d.data.sleep}h・心拍${d.data.heartRate}bpm・HP${hp}`;
    }).join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `あなたはHSP気質の管理職クリエイターのセルフケアアシスタントです。
過去7日間のヘルスデータを分析して週次レポートを作成してください。
必ず以下のJSONのみを返してください。説明文・マークダウン・バッククォートは一切不要です。
{"overall":"今週の総合評価（50文字以内）","bestDay":"ベストな日付（例：2026-05-01）","worstDay":"最も低かった日付","pattern":"気づいたパターン（60文字以内）","advice":"来週へのアドバイス（80文字以内・温かく）","sleepScore":75,"activityScore":60}`,
        messages: [{ role: 'user', content: `過去7日間：\n${summary}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `API error: ${err}` }, { status: 500 });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
