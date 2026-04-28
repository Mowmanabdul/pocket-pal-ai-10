import { Expense } from "@/lib/types";
import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval, format, isSameDay } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

interface WeeklySummaryProps {
  expenses: Expense[];
}

export function WeeklySummary({ expenses }: WeeklySummaryProps) {
  const { currency } = useCurrency();

  const { weekTotal, days, maxAmount } = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });

    const weekExpenses = expenses.filter((e) =>
      isWithinInterval(new Date(e.date), { start, end })
    );

    const dayList = eachDayOfInterval({ start, end }).map((day) => {
      const dayExpenses = weekExpenses.filter((e) =>
        isSameDay(new Date(e.date), day)
      );
      const total = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        date: day,
        label: format(day, "EEEEE"), // single letter
        total,
        isToday: isSameDay(day, now),
      };
    });

    const total = weekExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const max = Math.max(...dayList.map((d) => d.total), 1);

    return { weekTotal: total, days: dayList, maxAmount: max };
  }, [expenses]);

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
          </div>
          This Week
        </CardTitle>
        <span className="text-sm font-bold text-foreground">
          {formatCurrency(weekTotal, currency)}
        </span>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="flex items-end justify-between gap-1.5 h-[80px] px-1">
          {days.map((day, i) => {
            const heightPct = (day.total / maxAmount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={`w-full rounded-md transition-all ${
                      day.isToday ? "bg-primary" : "bg-primary/25"
                    }`}
                    style={{
                      height: `${Math.max(heightPct, day.total > 0 ? 8 : 4)}%`,
                      minHeight: "4px",
                    }}
                    title={`${format(day.date, "EEE")}: ${formatCurrency(day.total, currency)}`}
                  />
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
