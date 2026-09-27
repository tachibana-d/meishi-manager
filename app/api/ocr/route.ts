import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "画像がありません" }, { status: 400 });

    const semiIdx = image.indexOf(";base64,");
    if (semiIdx === -1) return NextResponse.json({ error: "画像形式が不正です" }, { status: 400 });

    const mimeType = image.slice(5, semiIdx);
    const data = image.slice(semiIdx + 8).replace(/\s/g, "");

    const prompt = `あなたは日本語の名刺を読み取る専門OCRです。画像を拡大して文字の形と名刺上の配置を確認し、以下のJSON形式だけを返してください。説明文やMarkdownは不要です。

基本情報は特に厳密に判定してください。
- 氏名は個人名だけ。会社名・部署名・役職・肩書き・ラベル（氏名、代表取締役など）は絶対に含めない。
- 会社名は法人名全体（株式会社、合同会社などの法人格を含む）。名刺に書かれた正式表記をそのまま使う。
- 部署は部署・課・室・局・本部などだけ。役職を混ぜない。
- 役職は代表取締役、部長、CEOなどだけ。氏名や部署を混ぜない。
- ふりがなは氏名の読みだけ。読み取れない場合はnull。
- 画像にない情報を推測・補完しない。文字が不鮮明な場合はnull。
- 日本語の空白や記号は、意味が変わらない範囲で整える。

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
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
