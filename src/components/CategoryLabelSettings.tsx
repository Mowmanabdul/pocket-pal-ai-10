import { useState } from "react";
import { ExpenseCategory, categoryConfig } from "@/lib/types";
import { useCategoryLabels } from "@/hooks/useCategoryLabels";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, RotateCcw, Tags } from "lucide-react";

const categories: ExpenseCategory[] = [
  'food', 'transport', 'entertainment', 'shopping', 
  'utilities', 'health', 'education', 'other'
];

export function CategoryLabelSettings() {
  const { upsertLabel, deleteLabel, isLoading } = useCategoryLabels();
  const { getCategoryLabel, labels } = useCategoryLabelsContext();
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});

  const handleNameChange = (category: ExpenseCategory, value: string) => {
    setEditingNames(prev => ({ ...prev, [category]: value }));
  };

  const handleSave = async (category: ExpenseCategory) => {
    const customName = editingNames[category]?.trim();
    if (customName && customName !== categoryConfig[category].label) {
      await upsertLabel.mutateAsync({ category, customName });
      setEditingNames(prev => {
        const next = { ...prev };
        delete next[category];
        return next;
      });
    }
  };

  const handleReset = async (category: ExpenseCategory) => {
    await deleteLabel.mutateAsync(category);
    setEditingNames(prev => {
      const next = { ...prev };
      delete next[category];
      return next;
    });
  };

  const getDisplayValue = (category: ExpenseCategory) => {
    if (editingNames[category] !== undefined) {
      return editingNames[category];
    }
    return getCategoryLabel(category);
  };

  const hasCustomLabel = (category: ExpenseCategory) => {
    return labels.some(l => l.category === category);
  };

  const hasChanges = (category: ExpenseCategory) => {
    const editingValue = editingNames[category];
    if (editingValue === undefined) return false;
    const currentLabel = getCategoryLabel(category);
    return editingValue.trim() !== currentLabel;
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
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-accent/5 to-chart-2/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Tags className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Category Names</CardTitle>
            <CardDescription>Customize how categories are displayed</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {categories.map((category) => {
          const config = categoryConfig[category];
          const showSave = hasChanges(category);
          const showReset = hasCustomLabel(category) && !showSave;

          return (
            <div 
              key={category}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div 
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: config.color }}
              />
              
              <div className="flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder={config.label}
                  value={getDisplayValue(category)}
                  onChange={(e) => handleNameChange(category, e.target.value)}
                  className="h-9 text-sm bg-background/50"
                />
              </div>
              
              <div className="flex items-center gap-1">
                {showSave && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSave(category)}
                    disabled={upsertLabel.isPending}
                    className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-primary/10"
                  >
                    {upsertLabel.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {showReset && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReset(category)}
                    disabled={deleteLabel.isPending}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Reset to default"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-2">
          Custom names will be shown throughout the app
        </p>
      </CardContent>
    </Card>
  );
}
