import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { useEmailPreferences } from "@/hooks/useEmailPreferences";
import { supabase } from "@/integrations/supabase/client";

export function EmailPreferencesSettings() {
  const { preferences, isLoading, upsertPreferences } = useEmailPreferences();
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
      }
    });
  }, []);

  useEffect(() => {
    if (preferences) {
      setWeeklyEnabled(preferences.weekly_summary_enabled);
      setEmail(preferences.email_address || userEmail || "");
    } else if (userEmail) {
      setEmail(userEmail);
    }
  }, [preferences, userEmail]);

  const handleSave = () => {
    upsertPreferences.mutate({
      weekly_summary_enabled: weeklyEnabled,
      email_address: email || null,
    });
  };

  const hasChanges =
    preferences?.weekly_summary_enabled !== weeklyEnabled ||
    (preferences?.email_address || "") !== email;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Receive weekly spending summaries with AI insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weekly-summary">Weekly Summary</Label>
            <p className="text-sm text-muted-foreground">
              Get a weekly email with spending highlights and AI insights
            </p>
          </div>
          <Switch
            id="weekly-summary"
            checked={weeklyEnabled}
            onCheckedChange={setWeeklyEnabled}
          />
        </div>

        {weeklyEnabled && (
          <div className="space-y-2">
            <Label htmlFor="email-address">Email Address</Label>
            <Input
              id="email-address"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll send your weekly summary to this address every Monday
            </p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={!hasChanges || upsertPreferences.isPending}
          className="w-full"
        >
          {upsertPreferences.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
