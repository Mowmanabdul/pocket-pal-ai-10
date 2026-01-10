import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCSVImport, ColumnMapping, ParsedExpense } from "@/hooks/useCSVImport";
import { useExpenses } from "@/hooks/useExpenses";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currencies";
import { ExpenseCategory } from "@/lib/types";

// Default category labels for display
const DEFAULT_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Food",
  transport: "Transport",
  entertainment: "Entertainment",
  shopping: "Shopping",
  utilities: "Utilities",
  health: "Health",
  education: "Education",
  other: "Other",
};

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "preview" | "importing";

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [mapping, setMapping] = useState<ColumnMapping>({
    amount: "",
    date: "",
    category: "",
    description: "",
  });
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { headers, rows, isLoading, error, handleFileUpload, mapToExpenses, reset } = useCSVImport();
  const { addExpense } = useExpenses();
  const { currency } = useCurrency();
  const { labels } = useCategoryLabels();
  const { toast } = useToast();

  const getCategoryLabel = (category: ExpenseCategory): string => {
    const customLabel = labels.find(l => l.category === category);
    return customLabel?.custom_name || DEFAULT_CATEGORY_LABELS[category];
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
      setStep("mapping");
    }
  };

  const handleMappingComplete = () => {
    if (!mapping.amount || !mapping.date) {
      toast({
        title: "Missing required fields",
        description: "Please map at least the Amount and Date columns",
        variant: "destructive",
      });
      return;
    }
    
    const expenses = mapToExpenses(mapping);
    setParsedExpenses(expenses);
    setStep("preview");
  };

  const handleImport = async () => {
    const validExpenses = parsedExpenses.filter(e => e.isValid);
    if (validExpenses.length === 0) {
      toast({
        title: "No valid expenses",
        description: "Please fix the errors before importing",
        variant: "destructive",
      });
      return;
    }

    setStep("importing");
    let successCount = 0;
    
    for (let i = 0; i < validExpenses.length; i++) {
      const expense = validExpenses[i];
      try {
        await addExpense.mutateAsync({
          amount: expense.amount,
          date: expense.date,
          category: expense.category,
          description: expense.description || undefined,
        });
        successCount++;
      } catch (err) {
        console.error("Failed to import expense:", err);
      }
      setImportProgress(Math.round(((i + 1) / validExpenses.length) * 100));
    }

    toast({
      title: "Import complete",
      description: `Successfully imported ${successCount} of ${validExpenses.length} expenses`,
    });

    handleClose();
  };

  const handleClose = () => {
    setStep("upload");
    setMapping({ amount: "", date: "", category: "", description: "" });
    setParsedExpenses([]);
    setImportProgress(0);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  const validCount = parsedExpenses.filter(e => e.isValid).length;
  const invalidCount = parsedExpenses.filter(e => !e.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import from CSV
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file from your bank or expense tracker"}
            {step === "mapping" && "Map CSV columns to expense fields"}
            {step === "preview" && "Review expenses before importing"}
            {step === "importing" && "Importing expenses..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 w-full text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                CSV files from banks, credit cards, or expense trackers
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {isLoading && <p className="text-sm text-muted-foreground">Parsing file...</p>}
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {rows.length} rows with {headers.length} columns
            </p>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Amount Column *</Label>
                <Select value={mapping.amount} onValueChange={(v) => setMapping(m => ({ ...m, amount: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date Column *</Label>
                <Select value={mapping.date} onValueChange={(v) => setMapping(m => ({ ...m, date: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Description Column</Label>
                <Select value={mapping.description} onValueChange={(v) => setMapping(m => ({ ...m, description: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Category Column</Label>
                <Select value={mapping.category} onValueChange={(v) => setMapping(m => ({ ...m, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-detect from description</SelectItem>
                    {headers.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={handleMappingComplete}>Continue</Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" /> {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" /> {invalidCount} invalid
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[300px] rounded-md border">
              <div className="p-4 space-y-2">
                {parsedExpenses.map((expense, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      expense.isValid ? "bg-muted/50" : "bg-destructive/10 border-destructive/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">
                          {expense.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date} • {getCategoryLabel(expense.category)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(expense.amount, currency)}</p>
                    </div>
                    {expense.errors.length > 0 && (
                      <div className="mt-2">
                        {expense.errors.map((err, i) => (
                          <p key={i} className="text-xs text-destructive">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>Back</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Expenses
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center">
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Importing expenses... {importProgress}%
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
