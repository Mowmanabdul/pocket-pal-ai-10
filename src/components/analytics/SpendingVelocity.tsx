import { useMemo } from "react";
import { Expense } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { Flame, Snowflake, Gauge, Target } from "lucide-react";
import { differenceInDays, startOfMonth, endOfMonth, format } from "date-fns";

interface SpendingVelocityProps {
  expenses: Expense[];
  selectedMonth?: string;
}

export function SpendingVelocity({ expenses, selectedMonth }: SpendingVelocityProps) {
  const { currency } = useCurrency();

  const velocityData = useMemo(() => {
    if (expenses.length === 0) return null;

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    let daysInPeriod: number;
    let daysPassed: number;

    if (selectedMonth && selectedMonth !== "all") {
      const [year, month] = selectedMonth.split("-").map(Number);
      periodStart = startOfMonth(new Date(year, month - 1));
      periodEnd = endOfMonth(new Date(year, month - 1));
      daysInPeriod = differenceInDays(periodEnd, periodStart) + 1;
      
      // If viewing current month, use days passed; otherwise full month
      if (format(now, "yyyy-MM") === selectedMonth) {
        daysPassed = differenceInDays(now, periodStart) + 1;
      } else {
        daysPassed = daysInPeriod;
      }
    } else {
      // All time - use first expense to now
      const dates = expenses.map(e => new Date(e.date).getTime());
      periodStart = new Date(Math.min(...dates));
      periodEnd = now;
      daysInPeriod = differenceInDays(periodEnd, periodStart) + 1;
      daysPassed = daysInPeriod;
    }

    const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const dailyRate = daysPassed > 0 ? totalSpent / daysPassed : 0;
    const projectedMonthly = dailyRate * 30;
    
    // Calculate if on track (simple heuristic)
    const expectedByNow = (totalSpent / daysPassed) * daysInPeriod;
    const velocityScore = daysInPeriod > 0 ? (daysPassed / daysInPeriod) * 100 : 100;
    
    // Determine velocity status
    let status: "hot" | "warm" | "cool" | "cold";
    if (dailyRate > 100) status = "hot";
    else if (dailyRate > 50) status = "warm";
    else if (dailyRate > 20) status = "cool";
    else status = "cold";

    return {
      dailyRate,
      projectedMonthly,
      totalSpent,
      daysPassed,
      daysInPeriod,
      velocityScore,
      status,
      expectedByNow,
    };
  }, [expenses, selectedMonth]);

  if (!velocityData) {
    return null;
  }

  const statusConfig = {
    hot: { icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", label: "High Spend" },
    warm: { icon: Gauge, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Moderate" },
    cool: { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", label: "On Track" },
    cold: { icon: Snowflake, color: "text-cyan-500", bg: "bg-cyan-500/10", label: "Low Spend" },
  };

  const config = statusConfig[velocityData.status];
  const StatusIcon = config.icon;

  return (
    <div className="glass-card-elevated p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Spending Velocity
        </h3>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Daily Rate</p>
          <p className="text-base md:text-lg font-bold text-foreground">
            {formatCurrency(velocityData.dailyRate, currency)}
          </p>
          <p className="text-[10px] text-muted-foreground">per day avg</p>
        </div>
        <div className="p-2.5 rounded-lg bg-secondary/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Projected</p>
          <p className="text-base md:text-lg font-bold text-foreground">
            {formatCurrency(velocityData.projectedMonthly, currency)}
          </p>
          <p className="text-[10px] text-muted-foreground">per month</p>
        </div>
      </div>

      {/* Progress through period */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Period Progress</span>
          <span>{velocityData.daysPassed} of {velocityData.daysInPeriod} days</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(velocityData.velocityScore, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
