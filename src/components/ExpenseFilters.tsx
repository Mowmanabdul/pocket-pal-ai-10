import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryConfig } from "@/lib/types";
import { Search, SlidersHorizontal } from "lucide-react";

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function ExpenseFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sortBy,
  onSortChange,
}: ExpenseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 bg-secondary border-0 rounded-lg text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[130px] h-9 bg-secondary border-0 rounded-lg text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All</SelectItem>
            {Object.entries(categoryConfig).map(([key, { label, color }]) => (
              <SelectItem key={key} value={key} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  <span>{label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[100px] h-9 bg-secondary border-0 rounded-lg text-xs">
            <SlidersHorizontal className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc" className="text-xs">Newest</SelectItem>
            <SelectItem value="date-asc" className="text-xs">Oldest</SelectItem>
            <SelectItem value="amount-desc" className="text-xs">Highest</SelectItem>
            <SelectItem value="amount-asc" className="text-xs">Lowest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
