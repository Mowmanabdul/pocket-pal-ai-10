import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm your **AI financial advisor**. I analyze your spending data to give you personalized insights.\n\nI can help you:\n• Spot spending patterns and trends\n• Find opportunities to save money\n• Create better budgeting habits\n• Answer questions about your finances\n\nWhat would you like to know?",
  created_at: new Date(),
};

export function useChatHistory() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load chat history on mount
  useEffect(() => {
    if (!user?.id) {
      setMessages([WELCOME_MESSAGE]);
      setIsInitialized(true);
      return;
    }

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(
            data.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              created_at: new Date(msg.created_at),
            }))
          );
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadHistory();
  }, [user?.id]);

  const addMessage = useCallback(
    async (message: Omit<ChatMessage, "id" | "created_at">) => {
      const newMessage: ChatMessage = {
        ...message,
        created_at: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from("chat_messages")
            .insert({
              user_id: user.id,
              role: message.role,
              content: message.content,
            })
            .select()
            .single();

          if (error) throw error;

          // Update with the saved ID
          setMessages((prev) =>
            prev.map((m) =>
              m === newMessage && data
                ? { ...m, id: data.id }
                : m
            )
          );
        } catch (error) {
          console.error("Error saving message:", error);
        }
      }

      return newMessage;
    },
    [user?.id]
  );

  const updateLastMessage = useCallback(
    async (content: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content,
          };
        }
        return updated;
      });
    },
    []
  );

  const saveLastAssistantMessage = useCallback(
    async (content: string) => {
      if (!user?.id) return;

      try {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          content,
        });
      } catch (error) {
        console.error("Error saving assistant message:", error);
      }
    },
    [user?.id]
  );

  const clearHistory = useCallback(async () => {
    if (user?.id) {
      try {
        const { error } = await supabase
          .from("chat_messages")
          .delete()
          .eq("user_id", user.id);

        if (error) throw error;
      } catch (error) {
        console.error("Error clearing chat history:", error);
        toast.error("Failed to clear chat history");
        return;
      }
    }

    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you today?",
        created_at: new Date(),
      },
    ]);
    toast.success("Chat history cleared");
  }, [user?.id]);

  return {
    messages,
    isLoading,
    isInitialized,
    addMessage,
    updateLastMessage,
    saveLastAssistantMessage,
    clearHistory,
  };
}
