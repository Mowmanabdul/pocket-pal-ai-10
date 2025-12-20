import { useExpenses } from "@/hooks/useExpenses";
import { AIChatPanel } from "@/components/AIChatPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { Sparkles, MessageCircle, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AIAdvisorPage() {
  const { expenses } = useExpenses();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">AI Financial Advisor</h1>
        </div>
        <p className="text-muted-foreground">
          Get personalized insights and chat with your AI advisor about your spending
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <div className="glass-card rounded-2xl overflow-hidden">
            <AIChatPanel expenses={expenses} />
          </div>
        </TabsContent>

        <TabsContent value="insights">
          <div className="glass-card rounded-2xl p-6">
            <AIInsightsPanel expenses={expenses} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="glass-card rounded-xl p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Pro Tip</p>
            <p className="text-sm text-muted-foreground">
              Try asking questions like "How can I reduce my food spending?" or "What's my biggest expense category?"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
