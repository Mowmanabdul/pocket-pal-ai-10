import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export type RecurringFrequency = 'weekly' | 'monthly';

export interface RecurringExpense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  next_occurrence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useRecurringExpenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recurringExpenses = [], isLoading, error } = useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RecurringExpense[];
    },
  });

  const addRecurringExpense = useMutation({
    mutationFn: async (expense: {
      amount: number;
      category: ExpenseCategory;
      description?: string;
      frequency: RecurringFrequency;
      start_date: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("recurring_expenses")
        .insert([{ 
          ...expense, 
          user_id: user.id,
          next_occurrence: expense.start_date 
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({
        title: "Recurring expense added",
        description: "Your recurring expense has been set up.",
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

  const updateRecurringExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RecurringExpense> & { id: string }) => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({
        title: "Updated",
        description: "Recurring expense has been updated.",
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

  const deleteRecurringExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurring_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({
        title: "Deleted",
        description: "Recurring expense has been removed.",
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

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({
        title: data.is_active ? "Activated" : "Paused",
        description: data.is_active 
          ? "Recurring expense is now active." 
          : "Recurring expense has been paused.",
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

  const processRecurring = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-recurring-expenses');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({
        title: "Processed",
        description: `Created ${data.created || 0} expense(s) from recurring items.`,
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

  return {
    recurringExpenses,
    isLoading,
    error,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    processRecurring,
  };
}
