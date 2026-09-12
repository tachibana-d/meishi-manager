import type { BusinessCardInput } from "./types";

export function parseCardText(text: string): Partial<BusinessCardInput> {
  const result: Partial<BusinessCardInput> = {};
  const normalizedText = text
    .replace(/[｜|]/g, "I")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xff10 + 0x30))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - (char >= "ａ" ? 0xfee0 : 0xfee0)))
    .replace(/\u00a0/g, " ");
  const lines = normalizedText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  // メールアドレス
  const emailMatch = normalizedText.match(/[\w.+-]+\s*@\s*[\w-]+(?:\s*\.\s*[\w-]+)+/);
  if (emailMatch) result.email = emailMatch[0].replace(/\s+/g, "");

  // ウェブサイト
  const webMatch = normalizedText.match(/(?:https?:\/\/|www\.)[^\s\n]+/i);
  if (webMatch) result.website = webMatch[0].replace(/[。、,]$/, "");

  // 携帯番号（080/090/070）
  const mobileMatch = normalizedText.match(/0[7-9]0[-－\s.]?\d{4}[-－\s.]?\d{4}/);
  if (mobileMatch) result.mobile = mobileMatch[0].replace(/[－\s]/g, "-");

  // 固定電話
  const phoneMatches = [...normalizedText.matchAll(/0\d{1,4}[-－\s.]?\d{1,4}[-－\s.]?\d{3,4}/g)];
  for (const m of phoneMatches) {
    const normalized = m[0].replace(/[－\s]/g, "-");
    if (normalized !== result.mobile) { result.phone = normalized; break; }
  }

  // 住所（郵便番号またはTEL/FAXの前の行）
  const addrMatch = normalizedText.match(/〒?\s*\d{3}[-－\s]?\d{4}[^\n]*/);
  if (addrMatch) result.address = addrMatch[0].replace(/\s+/g, "").trim();

  // 会社名
  const companyPatterns = ["株式会社", "有限会社", "合同会社", "一般社団法人", "公益社団法人", "LLC", "Inc", "Corp", "Co.,Ltd"];
  for (const pat of companyPatterns) {
    const idx = normalizedText.indexOf(pat);
    if (idx !== -1) {
      const line = lines.find((item) => item.includes(pat));
      if (line) result.company = line.replace(/^[|｜·•\s]+|[|｜·•\s]+$/g, "").trim();
      break;
    }
  }

  // 部署・役職（部/課/室/局/代表/CEO/CFO等を含む行）
  const deptMatch = lines.find((line) => /(部|課|室|局|グループ|チーム|ディビジョン)/.test(line));
  if (deptMatch) result.department = deptMatch.trim();

  const titleMatch = lines.find((line) => /(代表|取締役|部長|課長|所長|主任|担当|CEO|CFO|CTO|COO|Director|Manager|Executive)/i.test(line));
  if (titleMatch) result.title = titleMatch.trim();

  if (!result.name) {
    const candidate = lines.find((line) =>
      line.length >= 2 && line.length <= 20 &&
      !/[0-9@:/]/.test(line) &&
      !/(株式会社|有限会社|合同会社|部|課|室|局|代表|取締役|部長|課長|TEL|FAX|〒|http)/i.test(line)
    );
    if (candidate) result.name = candidate.replace(/[|｜·•]/g, "").trim();
  }

  return result;
}
