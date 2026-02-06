import { useExpenses } from "@/hooks/useExpenses";
import { AIChatPanel } from "@/components/AIChatPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Lightbulb, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AIAdvisorPage() {
  const { expenses } = useExpenses();

  return (
    <PageContainer maxWidth="lg">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">AI Advisor</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your personal finance assistant</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl bg-secondary/60 p-1">
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
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <AIChatPanel expenses={expenses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-3">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <AIInsightsPanel expenses={expenses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
