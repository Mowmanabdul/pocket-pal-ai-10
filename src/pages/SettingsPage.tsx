import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme, themeConfigs, ThemeColor } from "@/contexts/ThemeContext";
import { currencies } from "@/lib/currencies";
import { BudgetSettings } from "@/components/BudgetSettings";
import { CategoryLabelSettings } from "@/components/CategoryLabelSettings";
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
    <div className="p-3 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-5 h-5 md:w-7 md:h-7 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-foreground text-lg md:text-3xl">Settings</h1>
            <p className="text-muted-foreground text-xs md:text-base">Personalize your experience</p>
          </div>
        </div>
      </div>

      {/* Appearance / Theme */}
      <div className="glass-card-elevated p-3 md:p-6 space-y-4 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-chart-3/20 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-base md:text-xl">Appearance</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Choose your color theme</p>
          </div>
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
                  "relative flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left group hover:shadow-md",
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                )}
              >
                {/* Color preview dots */}
                <div className="flex gap-1 mb-2">
                  {config.preview.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="font-semibold text-foreground text-sm">{config.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{config.description}</p>
                
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

      {/* Currency Settings */}
      <div className="glass-card-elevated p-3 md:p-6 space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground text-base md:text-xl">Currency</h2>
            <p className="text-xs md:text-sm text-muted-foreground">Select your preferred currency</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-left hover:shadow-sm",
                currency.code === c.code
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary/50 hover:bg-secondary"
              )}
            >
              <span className="text-xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{c.code}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.symbol}</p>
              </div>
              {currency.code === c.code && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Settings */}
      <div className="animate-fade-in" style={{ animationDelay: "125ms" }}>
        <BudgetSettings />
      </div>

      {/* Category Names */}
      <div className="animate-fade-in" style={{ animationDelay: "137ms" }}>
        <CategoryLabelSettings />
      </div>

      {/* Coming Soon */}
      <div className="space-y-3 animate-fade-in" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coming Soon</h3>
        </div>

        {[
          { icon: Bell, title: "Notifications", desc: "Budget alerts & reminders" },
          { icon: Shield, title: "Privacy & Data", desc: "Export & security" },
        ].map((item, i) => (
          <div
            key={item.title}
            className="glass-card p-3 opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
