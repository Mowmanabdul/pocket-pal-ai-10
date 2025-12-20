import { useExpenses } from "@/hooks/useExpenses";
import { StatsCards } from "@/components/StatsCards";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingTrends } from "@/components/SpendingTrends";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
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
import { formatCurrency } from "@/lib/currencies";

export function DashboardPage() {
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currency } = useCurrency();

  const totalThisMonth = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-foreground">
            {getGreeting()} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            You have spent <span className="font-semibold text-foreground">{formatCurrency(totalThisMonth, currency)}</span> this month
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="lg"
              className="hidden sm:flex bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all rounded-xl h-12 px-6 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">New Expense</DialogTitle>
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

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* AI Insights Card */}
        <Link to="/ai-advisor" className="group">
          <div className="glass-card-elevated p-5 cursor-pointer hover:shadow-xl transition-all h-full animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-chart-3 flex items-center justify-center shadow-lg shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">AI Financial Advisor</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Get personalized insights & tips</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </div>
        </Link>

        {/* Analytics Card */}
        <Link to="/analytics" className="group">
          <div className="glass-card-elevated p-5 cursor-pointer hover:shadow-xl transition-all h-full animate-fade-in" style={{ animationDelay: "450ms" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-5 to-primary flex items-center justify-center shadow-lg shrink-0">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">Analytics</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Deep dive into your spending</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          </div>
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h2 className="text-foreground mb-4">By Category</h2>
          <SpendingChart expenses={expenses} />
        </div>

        <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "550ms" }}>
          <h2 className="text-foreground mb-4">30-Day Trend</h2>
          <SpendingTrends expenses={expenses} />
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "600ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground">Recent Expenses</h2>
          {expenses.length > 5 && (
            <Link to="/expenses">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-medium">
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
          <button className="fab-button sm:hidden bottom-24 right-4 shadow-xl">
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}
