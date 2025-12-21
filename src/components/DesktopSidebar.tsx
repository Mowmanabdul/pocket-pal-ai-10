import { LayoutDashboard, Receipt, Sparkles, Settings, TrendingUp, Wallet, LogOut, Home, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Recurring", url: "/recurring", icon: RefreshCw },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "AI Advisor", url: "/ai-advisor", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function DesktopSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className={cn(
      "hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300 sticky top-0",
      collapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className={cn(
          "flex items-center gap-3 overflow-hidden transition-all",
          collapsed && "justify-center"
        )}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow shrink-0">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-foreground whitespace-nowrap">
              SpendWise
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url || 
              (item.url !== "/" && location.pathname.startsWith(item.url));
            
            return (
              <li key={item.title}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-soft" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform",
                    isActive && "scale-110"
                  )} />
                  {!collapsed && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-foreground mb-2",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
