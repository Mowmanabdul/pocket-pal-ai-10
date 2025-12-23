import { useState } from "react";
import { ExpenseCategory, categoryConfig } from "@/lib/types";
import { useBudgets } from "@/hooks/useBudgets";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Trash2, Target } from "lucide-react";

const categories: ExpenseCategory[] = [
  'food', 'transport', 'entertainment', 'shopping', 
  'utilities', 'health', 'education', 'other'
];

export function BudgetSettings() {
  const { budgets, upsertBudget, deleteBudget, isLoading } = useBudgets();
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});

  const handleAmountChange = (category: ExpenseCategory, value: string) => {
    setEditingAmounts(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async (category: ExpenseCategory) => {
    const amount = parseFloat(editingAmounts[category] || '0');
    if (amount > 0) {
      await upsertBudget.mutateAsync({ category, amount });
      setEditingAmounts(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    }
  };

  const handleDelete = async (category: ExpenseCategory) => {
    await deleteBudget.mutateAsync(category);
  };

  const getBudgetAmount = (category: ExpenseCategory) => {
    const budget = budgets.find(b => b.category === category);
    return budget?.amount || 0;
  };

  const getDisplayValue = (category: ExpenseCategory) => {
    if (editingAmounts[category] !== undefined) {
      return editingAmounts[category];
    }
    const amount = getBudgetAmount(category);
    return amount > 0 ? amount.toString() : '';
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Monthly Budget Goals</CardTitle>
            <CardDescription>Set spending limits for each category</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {categories.map((category) => {
          const config = getCategoryConfig(category);
          const currentAmount = getBudgetAmount(category);
          const displayValue = getDisplayValue(category);
          const hasChanges = editingAmounts[category] !== undefined && 
            parseFloat(editingAmounts[category] || '0') !== currentAmount;

          return (
            <div 
              key={category}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: config.color }}
                />
                <span className="font-medium text-sm truncate">{config.label}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {currency.symbol}
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={displayValue}
                    onChange={(e) => handleAmountChange(category, e.target.value)}
                    className="w-28 pl-8 h-9 text-sm bg-background/50"
                  />
                </div>
                
                {hasChanges && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSave(category)}
                    disabled={upsertBudget.isPending}
                    className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {upsertBudget.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {currentAmount > 0 && !hasChanges && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category)}
                    disabled={deleteBudget.isPending}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
