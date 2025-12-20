import { useCurrency } from "@/contexts/CurrencyContext";
import { currencies } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, DollarSign, Palette, Bell, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { toast } = useToast();

  const handleCurrencyChange = (code: string) => {
    const newCurrency = currencies.find((c) => c.code === code);
    if (newCurrency) {
      setCurrency(newCurrency);
      toast({
        title: "Currency updated",
        description: `Your currency has been changed to ${newCurrency.name} (${newCurrency.symbol})`,
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Customize your SpendWise experience</p>
      </div>

      {/* Currency Settings */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Currency</h2>
            <p className="text-sm text-muted-foreground">Choose your preferred currency for displaying amounts</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Display Currency</Label>
          <Select value={currency.code} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full bg-secondary border-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono">{c.symbol}</span>
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">({c.code})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Coming Soon</h3>

        <div className="glass-card rounded-2xl p-6 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Palette className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize colors and theme</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">Notifications</h2>
              <p className="text-sm text-muted-foreground">Budget alerts and reminders</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">Data & Privacy</h2>
              <p className="text-sm text-muted-foreground">Export data and manage privacy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
