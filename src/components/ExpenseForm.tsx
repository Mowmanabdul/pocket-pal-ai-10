import { useState } from "react";
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
import { ExpenseCategory, categoryConfig } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Plus, Sparkles } from "lucide-react";

interface ExpenseFormProps {
  onSubmit: (expense: {
    amount: number;
    category: ExpenseCategory;
    description?: string;
    date: string;
  }) => void;
  isLoading?: boolean;
}

const quickAmounts = [10, 25, 50, 100, 250];

export function ExpenseForm({ onSubmit, isLoading }: ExpenseFormProps) {
  const { currency } = useCurrency();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onSubmit({
      amount: parseFloat(amount),
      category,
      description: description || undefined,
      date,
    });

    setAmount("");
    setDescription("");
    setCategory("other");
    setDate(new Date().toISOString().split("T")[0]);
  };

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
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
          <SelectTrigger className="h-12 bg-secondary border-0 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryConfig).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="font-medium">{label}</span>
                </span>
              </SelectItem>
            ))}
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

      <Button
        type="submit"
        disabled={isLoading || !amount}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-glow transition-all hover:shadow-lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Expense
      </Button>
    </form>
  );
}
