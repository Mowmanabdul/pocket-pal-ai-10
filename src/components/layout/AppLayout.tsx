import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
        {/* Top Header with Settings */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-2.5 flex items-center justify-end md:px-6">
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-28 md:pb-6 w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
