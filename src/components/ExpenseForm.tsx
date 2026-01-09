import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseCategory, categoryConfig, Expense } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { useReceiptUpload } from "@/hooks/useReceiptUpload";
import { Plus, Save, Camera, X, Loader2 } from "lucide-react";

interface ExpenseFormProps {
  onSubmit: (expense: {
    id?: string;
    amount: number;
    category: ExpenseCategory;
    description?: string;
    date: string;
    receipt_url?: string | null;
  }) => void;
  isLoading?: boolean;
  expense?: Expense | null;
  mode?: "add" | "edit";
}

const quickAmounts = [10, 25, 50, 100, 250];

export function ExpenseForm({ onSubmit, isLoading, expense, mode = "add" }: ExpenseFormProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const { uploadReceipt, isUploading } = useReceiptUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    if (expense && mode === "edit") {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setDescription(expense.description || "");
      setDate(expense.date);
      setReceiptUrl(expense.receipt_url || null);
      setReceiptPreview(expense.receipt_url || null);
    }
  }, [expense, mode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);

    // Upload file
    const url = await uploadReceipt(file);
    if (url) {
      setReceiptUrl(url);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onSubmit({
      ...(mode === "edit" && expense ? { id: expense.id } : {}),
      amount: parseFloat(amount),
      category,
      description: description || undefined,
      date,
      receipt_url: receiptUrl,
    });

    if (mode === "add") {
      setAmount("");
      setDescription("");
      setCategory("other");
      setDate(new Date().toISOString().split("T")[0]);
      setReceiptUrl(null);
      setReceiptPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isEditMode = mode === "edit";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Amount with quick buttons */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
            {currency.symbol}
          </span>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-10 h-14 text-xl font-semibold bg-secondary border-0 rounded-xl"
            required
          />
        </div>
        {!isEditMode && (
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <Button
                key={qa}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(qa.toString())}
                className="rounded-full text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                {currency.symbol}{qa}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
          <SelectTrigger className="h-12 bg-secondary border-0 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(categoryConfig).map((key) => {
              const config = getCategoryConfig(key as ExpenseCategory);
              return (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-3">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-medium">{config.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Date & Description */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 bg-secondary border-0 rounded-xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-secondary border-0 min-h-[80px] resize-none rounded-xl"
          />
        </div>
      </div>

      {/* Receipt Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Receipt <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {receiptPreview ? (
          <div className="relative w-full h-32 rounded-xl overflow-hidden bg-secondary">
            <img
              src={receiptPreview}
              alt="Receipt preview"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleRemoveReceipt}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-20 rounded-xl border-dashed border-2 hover:bg-secondary/50"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Camera className="w-5 h-5 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Add Receipt Photo"}
          </Button>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || !amount || isUploading}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-glow transition-all hover:shadow-lg"
      >
        {isEditMode ? (
          <>
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 mr-2" />
            Add Expense
          </>
        )}
      </Button>
    </form>
  );
}
