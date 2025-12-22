import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExpenseCategory } from "@/lib/types";

export interface CategoryLabel {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  custom_name: string;
  created_at: string;
  updated_at: string;
}

export function useCategoryLabels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["category-labels"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("category_labels")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data as CategoryLabel[];
    },
  });

  const upsertLabel = useMutation({
    mutationFn: async ({ category, customName }: { category: ExpenseCategory; customName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("category_labels")
        .upsert(
          { user_id: user.id, category, custom_name: customName },
          { onConflict: "user_id,category" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-labels"] });
      toast({
        title: "Category updated",
        description: "Your custom category name has been saved",
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

  const deleteLabel = useMutation({
    mutationFn: async (category: ExpenseCategory) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("category_labels")
        .delete()
        .eq("user_id", user.id)
        .eq("category", category);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-labels"] });
      toast({
        title: "Reset to default",
        description: "Category name reset to default",
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
    labels,
    isLoading,
    upsertLabel,
    deleteLabel,
  };
}
