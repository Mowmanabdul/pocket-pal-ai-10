import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme, themeConfigs, ThemeColor } from "@/contexts/ThemeContext";
import { currencies } from "@/lib/currencies";
import { BudgetSettings } from "@/components/BudgetSettings";
import { CategoryLabelSettings } from "@/components/CategoryLabelSettings";
import { EmailPreferencesSettings } from "@/components/EmailPreferencesSettings";
import { PageContainer } from "@/components/layout/PageContainer";
import { Globe, Palette, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

  return (
    <PageContainer maxWidth="sm">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize your experience</p>
      </div>

      {/* Theme */}
      <div className="glass-card-elevated p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Theme</h2>
        </div>
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
      </div>

      {/* Currency */}
      <div className="glass-card-elevated p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Currency</h2>
        </div>
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
      </div>

      {/* Budget Settings */}
      <BudgetSettings />

      {/* Category Labels */}
      <CategoryLabelSettings />

      {/* Email Preferences */}
      <EmailPreferencesSettings />
    </PageContainer>
  );
}
