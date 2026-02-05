import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  /** Maximum width variant - default is "md" */
  maxWidth?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl", 
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

/**
 * Standardized page container for consistent layout across all sections.
 * Handles responsive padding, centering, and max-width constraints.
 */
export function PageContainer({ 
  children, 
  maxWidth = "md",
  className 
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        // Base responsive padding
        "px-4 py-4 md:px-6 md:py-6 lg:px-8",
        // Spacing between children
        "space-y-5",
        // Full width with max constraint
        "w-full",
        maxWidthClasses[maxWidth],
        // Center on larger screens (where sidebar exists)
        "mx-auto",
        // Prevent horizontal overflow
        "min-w-0 box-border",
        className
      )}
    >
      {children}
    </div>
  );
}
