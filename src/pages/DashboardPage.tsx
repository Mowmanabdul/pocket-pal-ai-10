import { useExpenses } from "@/hooks/useExpenses";
import { StatsCards } from "@/components/StatsCards";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingTrends } from "@/components/SpendingTrends";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrency } from "@/contexts/CurrencyContext";

export function DashboardPage() {
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currency } = useCurrency();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's your spending overview</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden md:flex bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-glow hover:shadow-lg transition-all rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Expense</DialogTitle>
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

      {/* Stats Cards */}
      <StatsCards expenses={expenses} />

      {/* AI Insight Card */}
      {expenses.length > 0 && (
        <Link to="/ai-advisor">
          <div className="glass-card-elevated rounded-2xl p-4 md:p-5 cursor-pointer hover:shadow-elevated transition-all group animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-chart-3 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">AI Insights Available</h3>
                <p className="text-sm text-muted-foreground">Get personalized tips on your spending</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card-elevated rounded-2xl p-5 md:p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">By Category</h2>
          </div>
          <SpendingChart expenses={expenses} />
        </div>

        <div className="glass-card-elevated rounded-2xl p-5 md:p-6 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">30-Day Trend</h2>
          </div>
          <SpendingTrends expenses={expenses} />
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="glass-card-elevated rounded-2xl p-5 md:p-6 animate-fade-in" style={{ animationDelay: "700ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Recent Expenses</h2>
          {expenses.length > 5 && (
            <Link to="/expenses">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <ExpenseList
            expenses={expenses.slice(0, 5)}
            onDelete={(id) => deleteExpense.mutate(id)}
            isDeleting={deleteExpense.isPending}
          />
        )}
      </div>

      {/* Mobile FAB */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="fab-button md:hidden bottom-24 right-4">
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}
