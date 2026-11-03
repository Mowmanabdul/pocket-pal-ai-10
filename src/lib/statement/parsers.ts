import { ExpenseCategory } from "@/lib/types";

// ============= Types =============

export interface StatementTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // signed: negative = money out (expense), positive = money in (income)
  category: ExpenseCategory;
}

export interface StatementMapping {
  date: string; // header name
  amount: string; // single signed amount column (use instead of debit/credit)
  debit: string; // money-out column
  credit: string; // money-in column
  description: string;
  category: string;
}

export interface TabularStatement {
  headers: string[];
  rows: Record<string, string>[];
}

// ============= Categorization =============

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: ["food", "restaurant", "grocery", "grocer", "dining", "cafe", "coffee", "meal", "lunch", "dinner", "breakfast", "checkers", "pick n pay", "pnp", "spar", "kfc", "mcdonald", "mc donald", "nando", "steers", "wimpy", "debonairs", "roman's pizza", "ubereats", "uber eats", "mr d", "mcd", "bakery", "butcher", "takeaway"],
  transport: ["transport", "uber", "bolt", "taxi", "gas", "fuel", "petrol", "engen", "shell", "sasol", "total garage", "parking", "train", "bus", "metro", "gautrain", "toll", "e-toll", "car wash", "licenc", "licens"],
  entertainment: ["entertainment", "movie", "cinema", "netflix", "spotify", "showmax", "game pass", "playstation", "steam", "google play", "apple bill", "concert", "theatre", "streaming", "disney", "youtube premium", "prime video"],
  shopping: ["shopping", "amazon", "takealot", "shein", "temu", "store", "mall", "clothing", "fashion", "mrp", "sportscene", "game store", "makro", "woolworths", "h&m", "superbalist", "aliexpress", "purchase", "pos ", "card purchase"],
  utilities: ["utility", "utilities", "electric", "electricity", "prepaid", "water", "internet", "phone", "airtime", "data", "vodacom", "mtn", "cell c", "telkom", "rain", "bill", "subscription", "dstv", "municipal", "rates", "levy", "insurance"],
  health: ["health", "medical", "pharmacy", "clicks", "dischem", "doctor", "hospital", "gym", "fitness", "virgin active", "netcare", "mediclinic", "dentist", "optomet", "clinic"],
  education: ["education", "school", "course", "book", "tuition", "training", "learning", "unisa", "udemy", "coursera", "university", "college", "stationery"],
  other: [],
};

export function detectCategory(text: string): ExpenseCategory {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category as ExpenseCategory;
    }
  }
  return "other";
}

// ============= Amount parsing =============

export function parseAmountValue(input: string): number | null {
  if (!input) return null;
  let s = input.replace(/[^\d.,\-()+\s]/g, "").trim();
  if (!s) return null;
  const neg = s.includes("-") || (/^\(.*\)$/.test(s) && /\d/.test(s));
  s = s.replace(/[()\-+\s]/g, "");
  if (!/\d/.test(s)) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Whichever separator comes last is the decimal separator
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma > -1) {
    const decimals = s.length - lastComma - 1;
    // 2 decimals → decimal comma, otherwise thousands separator
    s = decimals === 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (lastDot > -1 && /^(\d{1,3}\.\d{3})+(\.\d{1,2})?$/.test(s) && !/^\d\.\d{3}$/.test(s)) {
    // Multi-group like 1.234.567 → dot is a thousands separator
    s = s.replace(/\./g, "");
  }

  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return neg ? -n : n;
}

// ============= Date parsing =============

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Scan date strings to decide whether ambiguous d/m values are day-first. */
export function detectDayFirst(values: string[]): boolean {
  for (const v of values) {
    const m = v.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (a > 12) return true;
      if (b > 12) return false;
    }
  }
  // Ambiguous — statements in ZA/UK/EU formats are day-first; the mapping
  // step exposes a toggle so the user can correct it.
  return true;
}

export function parseStatementDate(input: string, dayFirst: boolean): string | null {
  if (!input) return null;
  const v = input.trim();

  // ISO: 2026-03-05 or 2026-03-05T...
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Compact OFX: 20260305
  const compact = v.match(/^(\d{4})(\d{2})(\d{2})/);
  if (compact && v.length >= 8 && !v.includes("/")) {
    return `${compact[1]}-${compact[2]}-${compact[3]}`;
  }

  // d/m/yyyy or m/d/yyyy
  const slash = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (slash) {
    let d = Number(slash[1]);
    let m = Number(slash[2]);
    if (!dayFirst) [d, m] = [m, d];
    let y = Number(slash[3]);
    if (y < 100) y += 2000;
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // 05 Mar 2026 / 05-Mar-2026
  const dmy = v.match(/^(\d{1,2})[\s\-.]([a-z]{3,})[\s\-.](\d{2,4})/i);
  if (dmy) {
    const m = MONTHS[dmy[2].slice(0, 3).toLowerCase()];
    if (m) {
      let y = Number(dmy[3]);
      if (y < 100) y += 2000;
      return `${y}-${String(m).padStart(2, "0")}-${String(Number(dmy[1])).padStart(2, "0")}`;
    }
  }

  // Mar 5, 2026 / Mar-05-2026
  const mdy = v.match(/^([a-z]{3,})[\s\-.](\d{1,2})[\s\-.]?(\d{2,4})/i);
  if (mdy) {
    const m = MONTHS[mdy[1].slice(0, 3).toLowerCase()];
    if (m) {
      let y = Number(mdy[3]);
      if (y < 100) y += 2000;
      return `${y}-${String(m).padStart(2, "0")}-${String(Number(mdy[2])).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(v);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return null;
}

// ============= CSV / delimited text =============

function parseDelimited(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delimiter) { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); cur = ""; records.push(row); row = []; }
    else if (c === "\r") { /* skip */ }
    else cur += c;
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); records.push(row); }
  return records.filter((r) => r.some((v) => v.trim() !== ""));
}

function sniffDelimiter(text: string): string {
  const sample = text.split(/\r?\n/).slice(0, 25).join("\n");
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = -1;
  for (const d of candidates) {
    const count = sample.split(d).length - 1;
    if (count > bestCount) { bestCount = count; best = d; }
  }
  return bestCount > 0 ? best : ",";
}

export function parseDelimitedTable(content: string): TabularStatement {
  const text = content.replace(/^\uFEFF/, "");
  const delimiter = sniffDelimiter(text);
  const records = parseDelimited(text, delimiter);
  if (records.length === 0) throw new Error("The file appears to be empty");

  // Find the header row: first line mentioning typical column names
  let headerIdx = 0;
  for (let i = 0; i < Math.min(records.length, 15); i++) {
    const joined = records[i].join(" ").toLowerCase();
    if (/date|amount|desc|narrative|particular|payee|posted|debit|credit/.test(joined)) {
      headerIdx = i;
      break;
    }
  }

  const headers = records[headerIdx].map((h, i) => h.trim() || `Column ${i + 1}`);
  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < records.length; i++) {
    const vals = records[i];
    if (vals.length <= 1) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (vals[idx] ?? "").trim(); });
    rows.push(row);
  }
  if (rows.length === 0) throw new Error("No transaction rows found in the file");
  return { headers, rows };
}

// ============= Excel =============

export function parseExcelTable(buffer: ArrayBuffer): TabularStatement {
  // xlsx is imported lazily by the caller to keep the bundle light
  const XLSX = (globalThis as unknown as { __xlsx: typeof import("xlsx") }).__xlsx;
  if (!XLSX) throw new Error("Excel support unavailable");
  const workbook = XLSX.read(buffer, { cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const arr = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" });
  const nonEmpty = arr.filter((r) => r && r.some((v) => String(v ?? "").trim() !== ""));
  if (nonEmpty.length < 2) throw new Error("No transaction rows found in the spreadsheet");

  let headerIdx = 0;
  for (let i = 0; i < Math.min(nonEmpty.length, 15); i++) {
    const joined = nonEmpty[i].map((v) => String(v ?? "")).join(" ").toLowerCase();
    if (/date|amount|desc|narrative|particular|payee|posted|debit|credit/.test(joined)) {
      headerIdx = i;
      break;
    }
  }

  const headers = nonEmpty[headerIdx].map((v, i) => String(v ?? "").trim() || `Column ${i + 1}`);
  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < nonEmpty.length; i++) {
    const vals = nonEmpty[i];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = String(vals?.[idx] ?? "").trim(); });
    if (Object.values(row).some((v) => v !== "")) rows.push(row);
  }
  if (rows.length === 0) throw new Error("No transaction rows found in the spreadsheet");
  return { headers, rows };
}

// ============= OFX / QFX / QBO =============

function ofxTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>\\s*([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : "";
}

export function parseOFX(content: string): StatementTransaction[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  const transactions: StatementTransaction[] = [];
  for (const block of blocks) {
    const rawDate = ofxTag(block, "DTPOSTED");
    const amount = parseAmountValue(ofxTag(block, "TRNAMT"));
    const description = ofxTag(block, "NAME") || ofxTag(block, "MEMO") || ofxTag(block, "PAYEE");
    if (!rawDate || amount === null) continue;
    const date = parseStatementDate(rawDate, true);
    if (!date) continue;
    transactions.push({ date, description, amount, category: detectCategory(description) });
  }
  if (transactions.length === 0) throw new Error("No transactions found in this OFX file");
  return transactions;
}

// ============= QIF =============

export function parseQIF(content: string): StatementTransaction[] {
  if (!/^!Type:/im.test(content)) throw new Error("This doesn't look like a QIF file");
  const transactions: StatementTransaction[] = [];
  let date = "";
  let amount: number | null = null;
  let description = "";

  const flush = () => {
    if (date && amount !== null) {
      transactions.push({ date, description, amount, category: detectCategory(description) });
    }
    date = ""; amount = null; description = "";
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("^")) { flush(); continue; }
    if (line.startsWith("!")) continue;
    const code = line[0];
    const value = line.slice(1);
    if (code === "D") date = parseStatementDate(value, true) ?? date;
    else if (code === "T" || code === "U") amount = parseAmountValue(value);
    else if (code === "P") description = value;
    else if (code === "M" && !description) description = value;
  }
  flush();
  if (transactions.length === 0) throw new Error("No transactions found in this QIF file");
  return transactions;
}

// ============= Tabular rows → transactions =============

export function autoDetectMapping(headers: string[]): StatementMapping {
  const find = (patterns: RegExp[], exclude?: RegExp) => {
    const hit = headers.find((h) => {
      const l = h.toLowerCase().trim();
      if (exclude && exclude.test(l)) return false;
      return patterns.some((p) => p.test(l));
    });
    return hit ?? "";
  };

  const date = find([/^date$/, /trans(x|action)?\s*date/, /post(ed)?\s*date/, /date/, /value date/], /balance|birth|due/);
  const amount = find([/^amount$/, /^amt$/, /amount/, /value/, /^total/], /balance|running|available/);
  const debit = find([/debit/, /withdraw/, /paid\s*out/, /outflow/, /\bdr\b/]);
  const credit = find([/^credit$/, /credit(?! card)/, /deposit/, /paid\s*in/, /inflow/, /\bcr\b/], /card|limit/);
  const description = find([/desc/, /narrative/, /detail/, /memo/, /payee/, /particular/, /reference/, /transaction/, /merchant/], /balance|category|type/);
  const category = find([/category/, /\btype\b/, /\bcat\b/]);

  return { date, amount, debit, credit, description, category };
}

export function rowsToTransactions(
  rows: Record<string, string>[],
  mapping: StatementMapping,
  dayFirst: boolean
): StatementTransaction[] {
  // Work out sign convention from the data when a single amount column is used
  let signedMode: "signed" | "all-out" | null = null;
  if (mapping.amount) {
    const parsed = rows
      .map((r) => parseAmountValue(r[mapping.amount] ?? ""))
      .filter((n): n is number => n !== null);
    const hasNeg = parsed.some((n) => n < 0);
    const hasPos = parsed.some((n) => n > 0);
    if (hasNeg && hasPos) signedMode = "signed";
    else if (parsed.length > 2) signedMode = "all-out";
  }

  const transactions: StatementTransaction[] = [];
  for (const row of rows) {
    const date = parseStatementDate(row[mapping.date] ?? "", dayFirst);
    if (!date) continue;

    let amount: number | null = null;

    if (mapping.debit || mapping.credit) {
      const debitVal = mapping.debit ? parseAmountValue(row[mapping.debit] ?? "") ?? 0 : 0;
      const creditVal = mapping.credit ? parseAmountValue(row[mapping.credit] ?? "") ?? 0 : 0;
      if (debitVal > 0) amount = -Math.abs(debitVal);
      else if (creditVal > 0) amount = Math.abs(creditVal);
    } else if (mapping.amount) {
      const raw = parseAmountValue(row[mapping.amount] ?? "");
      if (raw === null) continue;
      if (signedMode === "all-out") amount = -Math.abs(raw);
      else amount = raw; // signed: negative = out, positive = in
    }
    if (amount === null || amount === 0) continue;

    const description = mapping.description ? row[mapping.description] ?? "" : "";
    let category: ExpenseCategory = "other";
    if (mapping.category && row[mapping.category]) {
      const catStr = row[mapping.category].toLowerCase();
      const match = Object.keys(CATEGORY_KEYWORDS).find((k) => catStr.includes(k));
      category = (match as ExpenseCategory) ?? detectCategory(description);
    } else {
      category = detectCategory(description);
    }

    transactions.push({ date, description, amount, category });
  }

  if (transactions.length === 0) {
    throw new Error("Couldn't read any transactions — check the column mapping");
  }
  return transactions;
}
