import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme, themeConfigs, ThemeColor } from "@/contexts/ThemeContext";
import { currencies } from "@/lib/currencies";
import { BudgetSettings } from "@/components/BudgetSettings";
import { Settings as SettingsIcon, Globe, Palette, Bell, Shield, Check, Sparkles } from "lucide-react";
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
      toast({
        title: "Currency updated",
        description: `Now using ${newCurrency.name} (${newCurrency.symbol})`,
      });
    }
  };

  const handleThemeChange = (newTheme: ThemeColor) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Switched to ${themeConfigs[newTheme].name} theme`,
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-foreground">Settings</h1>
            <p className="text-muted-foreground">Personalize your experience</p>
          </div>
        </div>
      </div>

      {/* Appearance / Theme */}
      <div className="glass-card-elevated p-5 md:p-6 space-y-5 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-chart-3/20 flex items-center justify-center">
            <Palette className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-foreground">Appearance</h2>
            <p className="text-sm text-muted-foreground">Choose your color theme</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(themeConfigs) as ThemeColor[]).map((key) => {
            const config = themeConfigs[key];
            const isActive = theme === key;
            
            return (
              <button
                key={key}
                onClick={() => handleThemeChange(key)}
                className={cn(
                  "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left group hover:shadow-md",
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                )}
              >
                {/* Color preview dots */}
                <div className="flex gap-1 mb-3">
                  {config.preview.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="font-semibold text-foreground">{config.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                
                {isActive && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Currency Settings */}
      <div className="glass-card-elevated p-5 md:p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground">Currency</h2>
            <p className="text-sm text-muted-foreground">Select your preferred currency</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left hover:shadow-sm",
                currency.code === c.code
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary/50 hover:bg-secondary"
              )}
            >
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{c.code}</p>
                <p className="text-xs text-muted-foreground truncate">{c.symbol}</p>
              </div>
              {currency.code === c.code && (
                <Check className="w-5 h-5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Settings */}
      <div className="animate-fade-in" style={{ animationDelay: "125ms" }}>
        <BudgetSettings />
      </div>

      {/* Coming Soon */}
      <div className="space-y-4 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coming Soon</h3>
        </div>

        {[
          { icon: Bell, title: "Notifications", desc: "Budget alerts & spending reminders" },
          { icon: Shield, title: "Privacy & Data", desc: "Export data & manage security" },
        ].map((item, i) => (
          <div
            key={item.title}
            className="glass-card p-5 opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
