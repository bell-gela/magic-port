export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text?.trim()) {
      return Response.json({ error: 'テキストがありません' }, { status: 400 });
    }

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
入力されたテキストを以下の3種類に分類し、JSON形式のみで返答してください。

分類ルール：
- trash: 感情の吐き出し、愚痴、モヤモヤ、ストレス発散のための言葉。保存不要なもの。
- idea: クリエイティブなアイデア、note記事のネタ、将来やりたいこと、インサイト。
- task: 具体的にやるべきこと、締め切りのあるもの、誰かへの連絡など。

返答フォーマット（必ずこのJSONのみ、説明文なし）：
{
  "type": "trash" | "idea" | "task",
  "summary": "20文字以内の要約",
  "comment": "ベイマックスらしい一言（50文字以内、温かく）",
  "quad": "do" | "schedule" | "delegate" | "delete"
}

quadはtypeがtaskの場合のみ設定。それ以外は"delete"を入れてください。`,
        messages: [{ role: 'user', content: text }],
      }),
    });

    const data = await response.json();
    const raw  = data.content?.[0]?.text ?? '';

    // JSONを安全にパース
    const clean  = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
