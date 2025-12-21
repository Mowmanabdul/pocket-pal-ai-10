import { useState } from "react";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { RecurringExpenseForm } from "@/components/RecurringExpenseForm";
import { RecurringExpensesList } from "@/components/RecurringExpensesList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Play, Loader2 } from "lucide-react";

export function RecurringPage() {
  const {
    recurringExpenses,
    isLoading,
    addRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    processRecurring,
  } = useRecurringExpenses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeCount = recurringExpenses.filter(e => e.is_active).length;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-4 to-chart-5 flex items-center justify-center shadow-lg">
            <RefreshCw className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-foreground">Recurring Expenses</h1>
            <p className="text-muted-foreground">
              {activeCount} active · {recurringExpenses.length} total
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => processRecurring.mutate()}
            disabled={processRecurring.isPending}
            className="gap-2"
          >
            {processRecurring.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Process Now
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Recurring Expense</DialogTitle>
              </DialogHeader>
              <RecurringExpenseForm
                onSubmit={(data) => {
                  addRecurringExpense.mutate(data);
                  setIsDialogOpen(false);
                }}
                isLoading={addRecurringExpense.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="glass-card border-primary/20 bg-primary/5 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">How it works</p>
              <p className="text-sm text-muted-foreground mt-1">
                Recurring expenses automatically create new expense entries based on their frequency. 
                Click "Process Now" to manually trigger pending expenses, or they'll be created automatically when due.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="glass-card animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader>
          <CardTitle className="text-lg">Your Recurring Expenses</CardTitle>
          <CardDescription>Manage your subscriptions and regular bills</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-xl shimmer" />
              ))}
            </div>
          ) : (
            <RecurringExpensesList
              expenses={recurringExpenses}
              onDelete={(id) => deleteRecurringExpense.mutate(id)}
              onToggleActive={(id, isActive) => toggleActive.mutate({ id, is_active: isActive })}
              isDeleting={deleteRecurringExpense.isPending}
              isToggling={toggleActive.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
