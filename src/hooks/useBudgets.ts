import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export interface Budget {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  amount: number;
  created_at: string;
  updated_at: string;
}

export function useBudgets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data as Budget[];
    },
  });

  const upsertBudget = useMutation({
    mutationFn: async (budget: { category: ExpenseCategory; amount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("budgets")
        .upsert(
          { 
            user_id: user.id, 
            category: budget.category, 
            amount: budget.amount 
          },
          { onConflict: 'user_id,category' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Budget saved",
        description: "Your budget has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBudget = useMutation({
    mutationFn: async (category: ExpenseCategory) => {
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("category", category);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({
        title: "Budget removed",
        description: "Your budget has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getBudgetByCategory = (category: ExpenseCategory) => {
    return budgets.find(b => b.category === category);
  };

  return {
    budgets,
    isLoading,
    error,
    upsertBudget,
    deleteBudget,
    getBudgetByCategory,
  };
}
