import React, { createContext, useContext, useMemo } from "react";
import { useCategoryLabels, CategoryLabel } from "@/hooks/useCategoryLabels";
import { ExpenseCategory, categoryConfig } from "@/lib/types";

interface CategoryLabelsContextValue {
  labels: CategoryLabel[];
  isLoading: boolean;
  getCategoryLabel: (category: ExpenseCategory) => string;
  getCategoryConfig: (category: ExpenseCategory) => { label: string; color: string };
}

const CategoryLabelsContext = createContext<CategoryLabelsContextValue | undefined>(undefined);

export function CategoryLabelsProvider({ children }: { children: React.ReactNode }) {
  const { labels, isLoading } = useCategoryLabels();

  const labelMap = useMemo(() => {
    const map = new Map<ExpenseCategory, string>();
    labels.forEach((label) => {
      map.set(label.category, label.custom_name);
    });
    return map;
  }, [labels]);

  const getCategoryLabel = (category: ExpenseCategory): string => {
    return labelMap.get(category) || categoryConfig[category].label;
  };

  const getCategoryConfig = (category: ExpenseCategory) => {
    const config = categoryConfig[category];
    return {
      ...config,
      label: labelMap.get(category) || config.label,
    };
  };

  return (
    <CategoryLabelsContext.Provider
      value={{ labels, isLoading, getCategoryLabel, getCategoryConfig }}
    >
      {children}
    </CategoryLabelsContext.Provider>
  );
}

export function useCategoryLabelsContext() {
  const context = useContext(CategoryLabelsContext);
  if (!context) {
    throw new Error("useCategoryLabelsContext must be used within a CategoryLabelsProvider");
  }
  return context;
}
