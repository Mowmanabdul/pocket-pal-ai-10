import { useCurrency } from "@/contexts/CurrencyContext";
import { currencies } from "@/lib/currencies";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Globe, Palette, Bell, Shield, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Customize your experience</p>
      </div>

      {/* Currency Settings */}
      <div className="glass-card-elevated rounded-2xl p-5 md:p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Currency</h2>
            <p className="text-sm text-muted-foreground">Select your preferred currency</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => handleCurrencyChange(c.code)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                currency.code === c.code
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-secondary hover:bg-secondary/80"
              )}
            >
              <span className="text-2xl">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{c.code}</p>
                <p className="text-xs text-muted-foreground truncate">{c.symbol}</p>
              </div>
              {currency.code === c.code && (
                <Check className="w-5 h-5 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Coming Soon</h3>

        {[
          { icon: Palette, title: "Appearance", desc: "Dark mode, colors & themes" },
          { icon: Bell, title: "Notifications", desc: "Budget alerts & reminders" },
          { icon: Shield, title: "Privacy", desc: "Data export & security" },
        ].map((item, i) => (
          <div
            key={item.title}
            className="glass-card rounded-2xl p-5 opacity-50 animate-fade-in"
            style={{ animationDelay: `${200 + i * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
