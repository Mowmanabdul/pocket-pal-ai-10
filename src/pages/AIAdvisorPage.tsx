import { useExpenses } from "@/hooks/useExpenses";
import { AIChatPanel } from "@/components/AIChatPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { MessageCircle, Lightbulb } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AIAdvisorPage() {
  const { expenses } = useExpenses();

  return (
    <div className="px-3 py-4 md:px-6 md:py-6 space-y-4 w-full max-w-3xl md:mx-auto min-w-0 box-border">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">AI Advisor</h1>
        <p className="text-sm text-muted-foreground">Personal finance assistant</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 rounded-xl bg-secondary/60 p-0.5">
          <TabsTrigger value="chat" className="flex items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <MessageCircle className="w-3.5 h-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
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
          <div className="glass-card-elevated rounded-xl p-4">
            <AIInsightsPanel expenses={expenses} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
