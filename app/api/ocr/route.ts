import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

    const semiIdx = image.indexOf(";base64,");
    if (semiIdx === -1) return NextResponse.json({ error: "画像形式が不正です" }, { status: 400 });

    const mimeType = image.slice(5, semiIdx);
    const data = image.slice(semiIdx + 8).replace(/\s/g, "");

    const prompt = `この名刺画像から情報を読み取り、以下のJSON形式で返してください。存在しない情報はnullにしてください。JSONのみを返し、説明文は不要です。

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
}`;

    const apiKey = process.env.GEMINI_API_KEY;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data } },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const json = await res.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "読み取り結果を解析できませんでした" }, { status: 500 });

    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: extracted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
