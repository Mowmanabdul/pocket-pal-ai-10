import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, User, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { Expense } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useChatHistory } from "@/hooks/useChatHistory";

interface AIChatPanelProps {
  expenses: Expense[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`;

const suggestedQuestions = [
  "How can I reduce spending?",
  "What's my biggest expense?",
  "Give me saving tips",
  "Analyze my trends",
];

export function AIChatPanel({ expenses }: AIChatPanelProps) {
  const { currency } = useCurrency();
  const {
    messages,
    isLoading: isLoadingHistory,
    isInitialized,
    addMessage,
    updateLastMessage,
    saveLastAssistantMessage,
    clearHistory,
  } = useChatHistory();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isStreaming) return;

    setInput("");
    setError(null);

    await addMessage({ role: "user", content: userMessage });
    setIsStreaming(true);

    try {
      // Build conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const expenseContext = expenses.slice(0, 50).map((e) => ({
        amount: e.amount,
        category: e.category,
        description: e.description,
        date: e.date,
      }));

      // Calculate stats for better context
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const categoryTotals: Record<string, number> = {};
      expenses.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });

      // Calculate this month's data
      const now = new Date();
      const thisMonth = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const thisMonthTotal = thisMonth.reduce((sum, e) => sum + Number(e.amount), 0);

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          expenses: {
            message: `USER'S FINANCIAL DATA:
- Currency: ${currency.code} (${currency.symbol})
- Total expenses tracked: ${expenses.length} transactions
- All-time total: ${currency.symbol}${totalExpenses.toFixed(2)}
- This month's total: ${currency.symbol}${thisMonthTotal.toFixed(2)}
- Spending by category: ${Object.entries(categoryTotals).map(([k, v]) => `${k}: ${currency.symbol}${v.toFixed(2)}`).join(", ")}

RECENT TRANSACTIONS:
${expenseContext.slice(0, 15).map(e => `- ${e.date}: ${e.category} - ${currency.symbol}${e.amount} ${e.description ? `(${e.description})` : ""}`).join("\n")}

CONVERSATION HISTORY:
${conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")}

USER'S QUESTION: ${userMessage}`,
          },
          type: "chat",
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit reached. Please wait a moment.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add credits.");
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add empty assistant message
      await addMessage({ role: "assistant", content: "" });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateLastMessage(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateLastMessage(assistantContent);
            }
          } catch {
            /* ignore */
          }
        }
      }

      // Save the final assistant message
      if (assistantContent) {
        await saveLastAssistantMessage(assistantContent);
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMessage);
      await addMessage({
        role: "assistant",
        content: `Sorry, I encountered an issue: ${errorMessage}`,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-[480px] md:h-[520px] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-2">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[480px] md:h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-xs text-foreground">Financial Advisor</p>
            <p className="text-[10px] text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
          disabled={isStreaming}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-3 py-1.5 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <p className="text-[10px] text-destructive flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-[10px] text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="flex flex-col max-w-[85%]">
              <div
                className={cn(
                  "rounded-2xl px-3 py-2",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary rounded-bl-md"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="ai-markdown text-xs leading-relaxed">
                    <ReactMarkdown>{msg.content || "Thinking..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs">{msg.content}</p>
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] text-muted-foreground mt-0.5 px-1",
                  msg.role === "user" ? "text-right" : "text-left"
                )}
              >
                {msg.created_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-3 h-3 text-primary" />
              </div>
            )}
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <div className="bg-secondary rounded-2xl rounded-bl-md px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 2 && !isStreaming && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border bg-card/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 items-end"
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances..."
            className="flex-1 min-h-[40px] max-h-[100px] bg-secondary border-0 rounded-xl text-xs resize-none py-2.5 px-3"
            disabled={isStreaming}
            rows={1}
          />
          <Button
            type="submit"
            disabled={isStreaming || !input.trim()}
            size="icon"
            className="h-10 w-10 rounded-xl bg-primary text-primary-foreground shrink-0 shadow-md hover:shadow-lg transition-shadow"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[9px] text-muted-foreground text-center mt-1.5">
          Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
