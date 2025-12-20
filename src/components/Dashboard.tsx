import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { StatsCards } from "./StatsCards";
import { SpendingChart } from "./SpendingChart";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Dashboard() {
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">SpendWise</h1>
          </div>
          <div className="flex items-center gap-3">
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
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <section>
          <StatsCards expenses={expenses} />
        </section>

        {/* Charts & AI Insights */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-display font-semibold text-foreground mb-4">
              Spending Breakdown
            </h2>
            <SpendingChart expenses={expenses} />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <AIInsightsPanel expenses={expenses} />
          </div>
        </section>

        {/* Recent Expenses */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Recent Expenses
          </h2>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading expenses...</div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onDelete={(id) => deleteExpense.mutate(id)}
              isDeleting={deleteExpense.isPending}
            />
          )}
        </section>
      </main>
    </div>
  );
}
