import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsContribution {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress extends SavingsGoal {
  saved: number;
  progress: number;
  remaining: number;
  contributions: SavingsContribution[];
}

export function useSavings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    queryClient.invalidateQueries({ queryKey: ["savings-contributions"] });
  };

  const onError = (error: Error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavingsGoal[];
    },
  });

  const { data: contributions = [], isLoading: isLoadingContributions } = useQuery({
    queryKey: ["savings-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_contributions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as SavingsContribution[];
    },
  });

  const addGoal = useMutation({
    mutationFn: async (goal: {
      name: string;
      target_amount: number;
      target_date?: string | null;
      color?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("savings_goals")
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Goal created", description: "Your savings goal is ready." });
    },
    onError,
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SavingsGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("savings_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Updated", description: "Savings goal has been updated." });
    },
    onError,
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Deleted", description: "Savings goal has been removed." });
    },
    onError,
  });

  const addContribution = useMutation({
    mutationFn: async (contribution: {
      goal_id: string;
      amount: number;
      date: string;
      note?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("savings_contributions")
        .insert([{ ...contribution, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Recorded", description: "Savings entry added." });
    },
    onError,
  });

  const deleteContribution = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("savings_contributions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Deleted", description: "Savings entry removed." });
    },
    onError,
  });

  const goalsWithProgress: GoalWithProgress[] = useMemo(() => {
    return goals.map((goal) => {
      const goalContributions = contributions.filter((c) => c.goal_id === goal.id);
      const saved = goalContributions.reduce((sum, c) => sum + Number(c.amount), 0);
      const target = Number(goal.target_amount);
      return {
        ...goal,
        saved,
        progress: target > 0 ? Math.min((saved / target) * 100, 100) : 0,
        remaining: Math.max(target - saved, 0),
        contributions: goalContributions,
      };
    });
  }, [goals, contributions]);

  const totalSaved = useMemo(
    () => contributions.reduce((sum, c) => sum + Number(c.amount), 0),
    [contributions]
  );

  const totalTarget = useMemo(
    () => goals.filter((g) => !g.is_archived).reduce((sum, g) => sum + Number(g.target_amount), 0),
    [goals]
  );

  return {
    goals,
    goalsWithProgress,
    contributions,
    totalSaved,
    totalTarget,
    isLoading: isLoadingGoals || isLoadingContributions,
    addGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
  };
}

/** Sum of savings contributions within a date interval. */
export function sumContributions(
  contributions: SavingsContribution[],
  start: Date,
  end: Date
): number {
  return contributions.reduce((sum, c) => {
    const d = new Date(c.date);
    return d >= start && d <= end ? sum + Number(c.amount) : sum;
  }, 0);
}
