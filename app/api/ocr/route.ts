import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

    // data:image/jpeg;base64,... を分割（改行・空白を除去）
    const semiIdx = image.indexOf(";base64,");
    if (semiIdx === -1) return NextResponse.json({ error: "画像形式が不正です" }, { status: 400 });

    const mimeType = image.slice(5, semiIdx); // "data:" の後
    const data = image.slice(semiIdx + 8).replace(/\s/g, ""); // ";base64," の後、空白除去

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      { inlineData: { data, mimeType } },
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
    if (!jsonMatch) return NextResponse.json({ error: "読み取り結果を解析できませんでした" }, { status: 500 });

    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: extracted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
