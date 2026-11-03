import { supabase } from "@/integrations/supabase/client";
import {
  StatementTransaction,
  TabularStatement,
  parseDelimitedTable,
  parseExcelTable,
  parseOFX,
  parseQIF,
  detectCategory,
  parseStatementDate,
} from "./parsers";

export type LoadedStatement =
  | { kind: "tabular"; table: TabularStatement }
  | { kind: "transactions"; transactions: StatementTransaction[] };

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-statement`;

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isStatementFile(file: File): boolean {
  const ext = extOf(file.name);
  const okExt = ["csv", "xlsx", "xls", "ofx", "qfx", "qbo", "qif", "pdf", "png", "jpg", "jpeg", "webp", "heic", "heif"].includes(ext);
  return okExt || file.type.startsWith("image/");
}

/** Read CSV/XLSX/OFX/QIF fully on-device. PDFs and photos are read by AI. */
export async function loadStatementFile(file: File): Promise<LoadedStatement> {
  const ext = extOf(file.name);

  if (ext === "csv" || ext === "txt") {
    return { kind: "tabular", table: parseDelimitedTable(await file.text()) };
  }

  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    (globalThis as unknown as { __xlsx: typeof import("xlsx") }).__xlsx = XLSX;
    return { kind: "tabular", table: parseExcelTable(await file.arrayBuffer()) };
  }

  if (ext === "ofx" || ext === "qfx" || ext === "qbo") {
    return { kind: "transactions", transactions: parseOFX(await file.text()) };
  }

  if (ext === "qif") {
    return { kind: "transactions", transactions: parseQIF(await file.text()) };
  }

  if (ext === "pdf") {
    const images = await pdfToImages(file);
    return { kind: "transactions", transactions: await aiExtractFromImages(images) };
  }

  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "heic", "heif"].includes(ext)) {
    const dataUrl = await fileToDataUrl(file);
    return { kind: "transactions", transactions: await aiExtractFromImages([dataUrl]) };
  }

  throw new Error("Unsupported file type. Use CSV, Excel, OFX, QIF, PDF or a photo of a statement.");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Couldn't read the file"));
    reader.readAsDataURL(file);
  });
}

/** Render PDF pages to JPEGs so the AI vision model can read them. */
async function pdfToImages(file: File, maxPages = 8): Promise<string[]> {
  const [{ default: workerUrl }, pdfjs] = await Promise.all([
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    import("pdfjs-dist"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(doc.numPages, maxPages);
  const images: string[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.82));
    canvas.width = 0;
  }
  doc.destroy();

  if (images.length === 0) throw new Error("Couldn't read the PDF file");
  return images;
}

interface RawAiTransaction {
  date: string;
  description: string;
  amount: number;
}

/** Send statement images to the AI statement reader, in page chunks. */
export async function aiExtractFromImages(images: string[]): Promise<StatementTransaction[]> {
  const { data: { session } } = await supabase.auth.getSession();

  const chunks: string[][] = [];
  for (let i = 0; i < images.length; i += 4) chunks.push(images.slice(i, i + 4));

  const raw: RawAiTransaction[] = [];
  for (const chunk of chunks) {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ images: chunk }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Please sign in again to import statements");
      throw new Error(body.error || `Statement reading failed (${res.status})`);
    }
    const body = await res.json();
    if (Array.isArray(body.transactions)) raw.push(...body.transactions);
  }

  const transactions: StatementTransaction[] = [];
  for (const t of raw) {
    const date = parseStatementDate(String(t.date ?? ""), true);
    const amount = Number(t.amount);
    if (!date || !isFinite(amount) || amount === 0) continue;
    const description = String(t.description ?? "").slice(0, 200);
    transactions.push({
      date,
      description,
      amount: Math.round(amount * 100) / 100,
      category: detectCategory(description),
    });
  }

  if (transactions.length === 0) {
    throw new Error("No transactions could be read from this statement. Try a clearer photo or a CSV export.");
  }
  return transactions;
}
