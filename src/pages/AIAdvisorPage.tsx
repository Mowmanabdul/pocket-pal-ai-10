import { useExpenses } from "@/hooks/useExpenses";
import { AIChatPanel } from "@/components/AIChatPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { Sparkles, MessageCircle, Lightbulb, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AIAdvisorPage() {
  const { expenses } = useExpenses();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-chart-3 flex items-center justify-center shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Advisor</h1>
            <p className="text-sm text-muted-foreground">Your personal finance assistant</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-secondary p-1">
          <TabsTrigger value="chat" className="flex items-center gap-2 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-soft">
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:shadow-soft">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <div className="glass-card-elevated rounded-2xl overflow-hidden animate-fade-in">
            <AIChatPanel expenses={expenses} />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="glass-card-elevated rounded-2xl p-5 md:p-6 animate-fade-in">
            <AIInsightsPanel expenses={expenses} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <div className="glass-card rounded-2xl p-4 border-primary/20 bg-primary/5 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Try asking</p>
            <p className="text-sm text-muted-foreground mt-1">
              "How can I save more?" • "What's my biggest expense?" • "Give me budgeting tips"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
