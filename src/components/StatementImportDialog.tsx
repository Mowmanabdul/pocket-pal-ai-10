import { useMemo, useRef, useState } from "react";
import {
  loadStatementFile,
  isStatementFile,
} from "@/lib/statement/fileLoader";
import {
  autoDetectMapping,
  rowsToTransactions,
  type StatementMapping,
  type StatementTransaction,
  type TabularStatement,
} from "@/lib/statement/parsers";
import { useExpenses } from "@/hooks/useExpenses";
import { useIncome } from "@/hooks/useIncome";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  Loader2,
  Upload,
  Wallet,
} from "lucide-react";

type Step = "upload" | "mapping" | "review" | "done";

interface ReviewItem extends StatementTransaction {
  included: boolean;
  duplicate: boolean;
}

interface ImportResult {
  expenses: number;
  income: number;
}

const CATEGORIES: ExpenseCategory[] = ["food", "transport", "entertainment", "shopping", "utilities", "health", "education", "other"];

const dupKey = (t: { date: string; amount: number; description: string }) =>
  `${t.date}|${Math.abs(t.amount).toFixed(2)}|${t.description.toLowerCase().trim()}`;

export function StatementImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const { expenses, insertExpenses } = useExpenses();
  const { insertIncome } = useIncome();

  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabular, setTabular] = useState<TabularStatement | null>(null);
  const [mapping, setMapping] = useState<StatementMapping>(autoDetectMapping([]));
  const [dayFirst, setDayFirst] = useState(true);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setLoading(false);
    setError(null);
    setTabular(null);
    setMapping(autoDetectMapping([]));
    setItems([]);
    setImporting(false);
    setResult(null);
    setDragOver(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && importing) return;
    onOpenChange(next);
    if (!next) reset();
  };

  const existingKeys = useMemo(
    () => new Set(expenses.map((e) => dupKey({ date: e.date, amount: Number(e.amount), description: e.description ?? "" }))),
    [expenses]
  );

  const toReviewItems = (txs: StatementTransaction[]): ReviewItem[] =>
    txs.map((t) => {
      const duplicate = existingKeys.has(dupKey(t));
      return { ...t, duplicate, included: !duplicate };
    });

  const processFile = async (file: File) => {
    if (!isStatementFile(file)) {
      setError("Unsupported file. Use CSV, Excel, OFX, QIF, PDF or a photo of a statement.");
      return;
    }
    setFileName(file.name);
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadStatementFile(file);
      if (loaded.kind === "tabular") {
        setTabular(loaded.table);
        setMapping(autoDetectMapping(loaded.table.headers));
        setDayFirst(true);
        setStep("mapping");
      } else {
        setTabular(null);
        setItems(toReviewItems(loaded.transactions));
        setStep(loaded.transactions.length > 0 ? "review" : "upload");
        if (loaded.transactions.length === 0) {
          setError("No transactions could be read from this statement. Try a clearer photo or a CSV export.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that file. Try another one.");
    } finally {
      setLoading(false);
    }
  };

  // Live preview of the mapping
  const mappedPreview = useMemo(() => {
    if (!tabular) return { count: 0, sample: [] as StatementTransaction[] };
    try {
      const txs = rowsToTransactions(tabular.rows, mapping, dayFirst);
      return { count: txs.length, sample: txs.slice(0, 3) };
    } catch {
      return { count: 0, sample: [] };
    }
  }, [tabular, mapping, dayFirst]);

  const continueFromMapping = () => {
    if (!tabular || mappedPreview.count === 0) return;
    try {
      setItems(toReviewItems(rowsToTransactions(tabular.rows, mapping, dayFirst)));
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read any transactions");
    }
  };

  const selected = items.filter((t) => t.included);
  const outTotal = selected.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  const inTotal = selected.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const dupCount = items.filter((t) => t.duplicate).length;

  const toggleAll = (included: boolean) => setItems((prev) => prev.map((t) => ({ ...t, included })));
  const selectFreshOnly = () => setItems((prev) => prev.map((t) => ({ ...t, included: !t.duplicate })));

  const runImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const expenseRows = selected
        .filter((t) => t.amount < 0)
        .map((t) => ({ amount: Math.abs(t.amount), category: t.category, description: t.description, date: t.date }));
      const incomeRows = selected
        .filter((t) => t.amount > 0)
        .map((t) => ({ amount: t.amount, description: t.description, date: t.date }));

      if (expenseRows.length > 0) await insertExpenses(expenseRows);
      if (incomeRows.length > 0) await insertIncome(incomeRows);

      setResult({ expenses: expenseRows.length, income: incomeRows.length });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed. Please try again.");
      toast({ title: "Import failed", description: error ?? "Please try again.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const headerSelect = (
    field: keyof StatementMapping,
    label: string,
    excludeBalance: boolean
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={mapping[field] || "none"}
        onValueChange={(v) => setMapping((m) => ({ ...m, [field]: v === "none" ? "" : v }))}
      >
        <SelectTrigger className="h-9 rounded-xl text-xs">
          <SelectValue placeholder="Not used" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not used</SelectItem>
          {(tabular?.headers ?? []).map((h) => {
            const l = h.toLowerCase();
            if (excludeBalance && /balance|available/.test(l)) return null;
            return <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );

  const content = (
    <div className="space-y-4">
      {step === "upload" && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/50 hover:bg-secondary/40"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-medium">Reading {fileName}…</p>
                <p className="text-xs text-muted-foreground">PDFs and photos are read by AI — this can take a few seconds</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold">Drop your bank statement here</p>
                <p className="text-xs text-muted-foreground">or tap to browse</p>
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {["CSV", "Excel", "OFX", "QIF", "PDF", "Photo"].map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-secondary/70 text-[10px] font-medium text-muted-foreground">{t}</span>
                  ))}
                </div>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".csv,.txt,.xlsx,.xls,.ofx,.qfx,.qbo,.qif,.pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              e.target.value = "";
            }}
          />
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <p className="text-[11px] text-muted-foreground text-center">
            CSV, Excel, OFX and QIF are read on your device. PDFs and photos are read by AI — nothing is shared beyond reading the statement.
          </p>
        </>
      )}

      {step === "mapping" && tabular && (
        <>
          <div className="flex items-center gap-2 text-sm">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            <span className="font-medium truncate">{fileName}</span>
            <span className="text-xs text-muted-foreground">· {tabular.rows.length} rows</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {headerSelect("date", "Date column", true)}
            {headerSelect("amount", "Signed amount", true)}
            {headerSelect("debit", "Money out (debit)", true)}
            {headerSelect("credit", "Money in (credit)", true)}
            {headerSelect("description", "Description", false)}
            {headerSelect("category", "Category", false)}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
            <div>
              <Label className="text-xs font-medium">Day-first dates</Label>
              <p className="text-[11px] text-muted-foreground">On for 05/03/2026 = 5 March</p>
            </div>
            <Switch checked={dayFirst} onCheckedChange={setDayFirst} />
          </div>
          <div className="rounded-xl bg-secondary/50 px-3 py-2 text-xs">
            {mappedPreview.count > 0 ? (
              <>
                <span className="font-semibold">{mappedPreview.count}</span> transactions detected
                {mappedPreview.sample.slice(0, 2).map((t, i) => (
                  <div key={i} className="text-muted-foreground truncate">
                    {t.date} · {t.description || "—"} · {formatCurrency(Math.abs(t.amount), currency)}
                  </div>
                ))}
              </>
            ) : (
              <span className="text-muted-foreground">Pick a date column and an amount (or debit/credit) column to continue.</span>
            )}
          </div>
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setStep("upload")}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />Back
            </Button>
            <Button size="sm" className="rounded-xl flex-1" disabled={mappedPreview.count === 0} onClick={continueFromMapping}>
              Continue with {mappedPreview.count} transactions
            </Button>
          </div>
        </>
      )}

      {step === "review" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Wallet className="w-3.5 h-3.5" />Money out
              </div>
              <p className="text-sm font-bold text-foreground">{formatCurrency(outTotal, currency)}</p>
              <p className="text-[11px] text-muted-foreground">{selected.filter((t) => t.amount < 0).length} expenses</p>
            </div>
            <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Landmark className="w-3.5 h-3.5" />Money in
              </div>
              <p className="text-sm font-bold text-foreground">{formatCurrency(inTotal, currency)}</p>
              <p className="text-[11px] text-muted-foreground">{selected.filter((t) => t.amount > 0).length} income</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 rounded-full text-[11px] px-2.5" onClick={() => toggleAll(true)}>Select all</Button>
            <Button variant="outline" size="sm" className="h-7 rounded-full text-[11px] px-2.5" onClick={() => toggleAll(false)}>Clear</Button>
            {dupCount > 0 && (
              <Button variant="outline" size="sm" className="h-7 rounded-full text-[11px] px-2.5" onClick={selectFreshOnly}>
                Skip {dupCount} already added
              </Button>
            )}
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/40">
            {items.map((t, i) => (
              <div key={i} className={cn("flex items-center gap-2 px-3 py-2", !t.included && "opacity-50")}>
                <Checkbox
                  checked={t.included}
                  onCheckedChange={(v) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, included: v === true } : x)))}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {t.description || <span className="text-muted-foreground">No description</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{t.date}</p>
                </div>
                <Select
                  value={t.category}
                  onValueChange={(v) => setItems((prev) => prev.map((x, j) => (j === i ? { ...x, category: v as ExpenseCategory } : x)))}
                >
                  <SelectTrigger className="h-7 w-28 shrink-0 rounded-lg text-[10px] px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{getCategoryConfig(c).label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className={cn("text-xs font-semibold w-20 text-right shrink-0", t.amount > 0 ? "text-emerald-600" : "text-foreground")}>
                  {t.amount > 0 ? "+" : "−"}{formatCurrency(Math.abs(t.amount), currency)}
                </span>
              </div>
            ))}
          </div>

          {dupCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {dupCount} look like they're already in your expenses — they're unticked.
            </p>
          )}
          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setStep(tabular ? "mapping" : "upload")}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />Back
            </Button>
            <Button size="sm" className="rounded-xl flex-1" disabled={selected.length === 0 || importing} onClick={runImport}>
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add ${selected.length} to my records`}
            </Button>
          </div>
        </>
      )}

      {step === "done" && result && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-semibold">Import complete</p>
          <p className="text-xs text-muted-foreground">
            {result.expenses} expenses and {result.income} income records added.
            {result.expenses + result.income === 0 && " Nothing was selected."}
          </p>
          <Button size="sm" className="rounded-xl mt-2" onClick={() => handleOpenChange(false)}>Done</Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">Import bank statement</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Import bank statement</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
