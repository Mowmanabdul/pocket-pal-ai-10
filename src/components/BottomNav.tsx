import { Receipt, Sparkles, TrendingUp, Home, RefreshCw } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Recurring", url: "/recurring", icon: RefreshCw },
  { title: "AI", url: "/ai-advisor", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-bottom">
      <div className="mx-3 mb-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-premium">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url || 
              (item.url !== "/" && location.pathname.startsWith(item.url));
            
            return (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "nav-item flex-1 transition-all duration-200",
                  isActive ? "nav-item-active" : "nav-item-inactive"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide",
                  isActive && "text-primary"
                )}>{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
