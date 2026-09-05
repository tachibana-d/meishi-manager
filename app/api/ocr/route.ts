import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

  // data:image/jpeg;base64,... → strip prefix
  const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "invalid image format" }, { status: 400 });
  const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const data = match[2];

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data },
          },
          {
            type: "text",
            text: `この名刺画像から情報を読み取り、以下のJSON形式で返してください。存在しない情報はnullにしてください。JSONのみを返し、説明文は不要です。

{
  "name": "氏名（漢字）",
  "nameKana": "氏名（ふりがな、ない場合はnull）",
  "company": "会社名",
  "department": "部署名（ない場合はnull）",
  "title": "役職（ない場合はnull）",
  "email": "メールアドレス（ない場合はnull）",
  "phone": "電話番号（固定電話、ない場合はnull）",
  "mobile": "携帯番号（ない場合はnull）",
  "address": "住所（ない場合はnull）",
  "website": "ウェブサイトURL（ない場合はnull）"
}`,
          },
        ],
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text")?.text ?? "";

  // JSONを抽出（```jsonブロックや余分なテキストを除去）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "parse failed" }, { status: 500 });

  try {
    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: extracted });
  } catch {
    return NextResponse.json({ error: "invalid JSON from model" }, { status: 500 });
  }
}
