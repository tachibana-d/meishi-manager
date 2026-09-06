import type { BusinessCardInput } from "./types";

export function parseCardText(text: string): Partial<BusinessCardInput> {
  const result: Partial<BusinessCardInput> = {};

  // メールアドレス
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  if (emailMatch) result.email = emailMatch[0];

  // ウェブサイト
  const webMatch = text.match(/https?:\/\/[^\s\n]+/);
  if (webMatch) result.website = webMatch[0].replace(/[。、,]$/, "");

  // 携帯番号（080/090/070）
  const mobileMatch = text.match(/0[7-9]0[-－\s]?\d{4}[-－\s]?\d{4}/);
  if (mobileMatch) result.mobile = mobileMatch[0].replace(/[－\s]/g, "-");

  // 固定電話
  const phoneMatches = [...text.matchAll(/0\d{1,4}[-－\s]\d{1,4}[-－\s]\d{3,4}/g)];
  for (const m of phoneMatches) {
    const normalized = m[0].replace(/[－\s]/g, "-");
    if (normalized !== result.mobile) { result.phone = normalized; break; }
  }

  // 住所（郵便番号またはTEL/FAXの前の行）
  const addrMatch = text.match(/〒?\s*\d{3}[-－]\d{4}[^\n]*/);
  if (addrMatch) result.address = addrMatch[0].trim();

  // 会社名
  const companyPatterns = ["株式会社", "有限会社", "合同会社", "一般社団法人", "公益社団法人", "LLC", "Inc", "Corp", "Co.,Ltd"];
  for (const pat of companyPatterns) {
    const idx = text.indexOf(pat);
    if (idx !== -1) {
      const start = text.lastIndexOf("\n", idx) + 1;
      const end = text.indexOf("\n", idx);
      result.company = text.slice(start, end === -1 ? undefined : end).trim();
      break;
    }
  }

  // 部署・役職（部/課/室/局/代表/CEO/CFO等を含む行）
  const deptMatch = text.match(/^.*(部|課|室|局|グループ|チーム|ディビジョン).*$/m);
  if (deptMatch) result.department = deptMatch[0].trim();

  const titleMatch = text.match(/^.*(代表|取締役|部長|課長|所長|主任|担当|CEO|CFO|CTO|COO|Director|Manager|Executive).*$/m);
  if (titleMatch) result.title = titleMatch[0].trim();

  return result;
}
