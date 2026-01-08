import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailPreferences {
  id: string;
  user_id: string;
  weekly_summary_enabled: boolean;
  email_address: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmailPreferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["email-preferences"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as EmailPreferences | null;
    },
  });

  const upsertPreferences = useMutation({
    mutationFn: async (prefs: { weekly_summary_enabled: boolean; email_address: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          weekly_summary_enabled: prefs.weekly_summary_enabled,
          email_address: prefs.email_address,
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your email preferences have been updated.",
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
    preferences,
    isLoading,
    error,
    upsertPreferences,
  };
}
