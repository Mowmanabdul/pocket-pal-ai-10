import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme, themeConfigs, ThemeColor } from "@/contexts/ThemeContext";
import { currencies } from "@/lib/currencies";
import { BudgetSettings } from "@/components/BudgetSettings";
import { CategoryLabelSettings } from "@/components/CategoryLabelSettings";
import { EmailPreferencesSettings } from "@/components/EmailPreferencesSettings";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Globe, Palette, Check, Settings, Target, Tags, Bell, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleCurrencyChange = (code: string) => {
    const newCurrency = currencies.find((c) => c.code === code);
    if (newCurrency) {
      setCurrency(newCurrency);
      toast({ title: "Currency updated", description: `Now using ${newCurrency.symbol}` });
    }
  };

  const handleThemeChange = (newTheme: ThemeColor) => {
    setTheme(newTheme);
    toast({ title: "Theme updated", description: `Switched to ${themeConfigs[newTheme].name}` });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <PageContainer maxWidth="lg">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Personalize your experience</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10 rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="appearance" className="flex items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Budgets</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Tags className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Categories</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notify</span>
          </TabsTrigger>
        </TabsList>

        {/* Appearance: theme + currency */}
        <TabsContent value="appearance" className="mt-4 space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(themeConfigs) as ThemeColor[]).map((key) => {
                  const config = themeConfigs[key];
                  const isActive = theme === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className={cn(
                        "relative flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left",
                        isActive ? "border-primary bg-primary/5" : "border-transparent bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      <div className="flex gap-1 mb-2">
                        {config.preview.map((color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <p className="font-medium text-foreground text-sm">{config.name}</p>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Currency
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCurrencyChange(c.code)}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left",
                      currency.code === c.code ? "border-primary bg-primary/5" : "border-transparent bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{c.code}</p>
                    </div>
                    {currency.code === c.code && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Account</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="mt-4">
          <BudgetSettings />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <CategoryLabelSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <EmailPreferencesSettings />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
