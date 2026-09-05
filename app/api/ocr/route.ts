import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  if (!image) return NextResponse.json({ error: "image required" }, { status: 400 });

  const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "invalid image format" }, { status: 400 });
  const mimeType = match[1];
  const data = match[2];

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: { data, mimeType },
    },
    `この名刺画像から情報を読み取り、以下のJSON形式で返してください。存在しない情報はnullにしてください。JSONのみを返し、説明文は不要です。

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
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "parse failed" }, { status: 500 });

  try {
    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: extracted });
  } catch {
    return NextResponse.json({ error: "invalid JSON from model" }, { status: 500 });
  }
}
