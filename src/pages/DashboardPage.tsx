import { useExpenses } from "@/hooks/useExpenses";
import { StatsCards } from "@/components/StatsCards";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingTrends } from "@/components/SpendingTrends";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DashboardPage() {
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              onSubmit={(expense) => {
                addExpense.mutate(expense);
                setIsDialogOpen(false);
              }}
              isLoading={addExpense.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <StatsCards expenses={expenses} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Spending by Category
          </h2>
          <SpendingChart expenses={expenses} />
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">
            30-Day Spending Trend
          </h2>
          <SpendingTrends expenses={expenses} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-foreground mb-4">
          Recent Expenses
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <ExpenseList
            expenses={expenses.slice(0, 5)}
            onDelete={(id) => deleteExpense.mutate(id)}
            isDeleting={deleteExpense.isPending}
          />
        )}
      </div>
    </div>
  );
}
