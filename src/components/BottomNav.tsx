import { LayoutDashboard, Receipt, Sparkles, Settings, TrendingUp, Home } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Analytics", url: "/analytics", icon: TrendingUp },
  { title: "AI", url: "/ai-advisor", icon: Sparkles },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.url || 
            (item.url !== "/" && location.pathname.startsWith(item.url));
          
          return (
            <NavLink
              key={item.title}
              to={item.url}
              className={cn(
                "nav-item flex-1",
                isActive ? "nav-item-active" : "nav-item-inactive"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-all",
                isActive && "scale-110"
              )} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
