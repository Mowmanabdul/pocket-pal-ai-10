import { useExpenses } from "@/hooks/useExpenses";
import { StatsCards } from "@/components/StatsCards";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingTrends } from "@/components/SpendingTrends";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetAlerts } from "@/components/BudgetAlerts";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardPage() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const { currency } = useCurrency();
  const isMobile = useIsMobile();

  const overallTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleSubmit = (expense: Parameters<typeof addExpense.mutate>[0]) => {
    addExpense.mutate(expense);
    setIsOpen(false);
  };

  const formContent = (
    <ExpenseForm
      onSubmit={handleSubmit}
      isLoading={addExpense.isPending}
    />
  );

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-7xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground">
            {getGreeting()}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total tracked: <span className="font-semibold text-foreground">{formatCurrency(overallTotal, currency)}</span>
          </p>
        </div>
        
        {/* Desktop Dialog */}
        <Dialog open={!isMobile && isOpen} onOpenChange={(open) => !isMobile && setIsOpen(open)}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              className="hidden sm:flex bg-primary text-primary-foreground rounded-lg h-8 px-4 text-xs font-medium"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">New Expense</DialogTitle>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Alerts */}
      <BudgetAlerts expenses={expenses} />

      {/* Stats Cards */}
      <StatsCards expenses={expenses} />

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* AI Insights Card */}
        <Link to="/ai-advisor" className="group">
          <div className="glass-card-elevated p-4 cursor-pointer hover:shadow-lg transition-all duration-300 h-full border border-transparent hover:border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/80 to-chart-3/80 flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">AI Advisor</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Get personalized insights</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>
        </Link>

        {/* Analytics Card */}
        <Link to="/analytics" className="group">
          <div className="glass-card-elevated p-4 cursor-pointer hover:shadow-lg transition-all duration-300 h-full border border-transparent hover:border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-chart-5/80 to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">Analytics</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Deep dive into spending</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>
        </Link>
      </div>

      {/* Budget Progress */}
      <div>
        <BudgetProgress expenses={expenses} />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="glass-card-elevated p-4 md:p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">Spending by Category</h2>
          <SpendingChart expenses={expenses} />
        </div>

        <div className="glass-card-elevated p-4 md:p-5">
          <h2 className="text-sm font-bold text-foreground mb-4">30-Day Trend</h2>
          <SpendingTrends expenses={expenses} />
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="glass-card-elevated p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground">Recent Expenses</h2>
          {expenses.length > 5 && (
            <Link to="/expenses">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-xs h-8 px-3 font-medium">
                View All
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg shimmer" />
            ))}
          </div>
        ) : (
          <ExpenseList
            expenses={expenses.slice(0, 5)}
            onDelete={(id) => deleteExpense.mutate(id)}
            onEdit={(expense) => updateExpense.mutate(expense)}
            onDuplicate={(expense) => addExpense.mutate(expense)}
            isDeleting={deleteExpense.isPending}
            isUpdating={updateExpense.isPending}
            isAdding={addExpense.isPending}
          />
        )}
      </div>

      {/* Mobile Drawer */}
      <Drawer open={isMobile && isOpen} onOpenChange={(open) => isMobile && setIsOpen(open)}>
        <DrawerTrigger asChild>
          <button 
            className="fab-button sm:hidden bottom-24 right-4 shadow-xl"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">New Expense</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
