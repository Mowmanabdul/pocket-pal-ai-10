import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  /** Maximum width variant - default is "lg" */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

const maxWidthClasses = {
  sm: "max-w-xl",
  md: "max-w-2xl", 
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-full",
};

/**
 * Standardized page container for consistent layout across all sections.
 * Handles responsive padding, centering, and max-width constraints.
 */
export function PageContainer({ 
  children, 
  maxWidth = "lg",
  className 
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        // Full width container with centered content
        "w-full flex justify-center",
      )}
    >
      <div 
        className={cn(
          // Base responsive padding - symmetrical on all sides
          "px-4 py-5 md:px-6 md:py-6",
          // Spacing between children
          "space-y-4 md:space-y-5",
          // Full width with max constraint
          "w-full",
          maxWidthClasses[maxWidth],
          // Prevent horizontal overflow
          "min-w-0 box-border",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
