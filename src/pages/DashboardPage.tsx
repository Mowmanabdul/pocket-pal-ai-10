import { useExpenses } from "@/hooks/useExpenses";
import { StatsCards } from "@/components/StatsCards";
import { SpendingChart } from "@/components/SpendingChart";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
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
    <div className="p-4 md:p-6 lg:p-8 space-y-5 w-full max-w-5xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{getGreeting()}</h1>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{formatCurrency(overallTotal, currency)}</span>
          </p>
        </div>
        
        {/* Desktop Add Button */}
        <Dialog open={!isMobile && isOpen} onOpenChange={(open) => !isMobile && setIsOpen(open)}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              className="hidden sm:flex rounded-xl h-9 px-4 text-sm font-medium"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
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

      {/* Budget Alerts - Only show when there are alerts */}
      <BudgetAlerts expenses={expenses} />

      {/* Stats Cards */}
      <StatsCards expenses={expenses} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Left Column - Charts */}
        <div className="lg:col-span-3 space-y-4">
          {/* Spending Chart */}
          <div className="glass-card-elevated p-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Spending by Category</h2>
            <SpendingChart expenses={expenses} />
          </div>

          {/* Budget Progress */}
          <BudgetProgress expenses={expenses} />
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-2">
          <div className="glass-card-elevated p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              {expenses.length > 5 && (
                <Link to="/expenses">
                  <Button variant="ghost" size="sm" className="text-primary text-xs h-7 px-2">
                    View All
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg shimmer" />
                ))}
              </div>
            ) : (
              <ExpenseList
                expenses={expenses.slice(0, 6)}
                onDelete={(id) => deleteExpense.mutate(id)}
                onEdit={(expense) => updateExpense.mutate(expense)}
                onDuplicate={(expense) => addExpense.mutate(expense)}
                isDeleting={deleteExpense.isPending}
                isUpdating={updateExpense.isPending}
                isAdding={addExpense.isPending}
                compact
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
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
