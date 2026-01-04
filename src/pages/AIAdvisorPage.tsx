import { useExpenses } from "@/hooks/useExpenses";
import { AIChatPanel } from "@/components/AIChatPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { Sparkles, MessageCircle, Lightbulb, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AIAdvisorPage() {
  const { expenses } = useExpenses();

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-4xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-accent to-chart-3 flex items-center justify-center">
          <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground">AI Advisor</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Personal finance assistant</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 rounded-lg bg-secondary p-0.5">
          <TabsTrigger value="chat" className="flex items-center gap-1.5 rounded-md text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5 rounded-md text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Lightbulb className="w-3.5 h-3.5" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-3">
          <div className="glass-card-elevated rounded-xl overflow-hidden">
            <AIChatPanel expenses={expenses} />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-3">
          <div className="glass-card-elevated rounded-xl p-3 md:p-4">
            <AIInsightsPanel expenses={expenses} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips Card */}
      <div className="glass-card rounded-xl p-3 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Ask anything</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              "How can I reduce spending?" • "Analyze trends"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
