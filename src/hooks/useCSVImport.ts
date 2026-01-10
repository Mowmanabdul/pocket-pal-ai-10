import { useState } from "react";
import { ExpenseCategory } from "@/lib/types";

export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  amount: string;
  date: string;
  category: string;
  description: string;
}

export interface ParsedExpense {
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string;
  isValid: boolean;
  errors: string[];
}

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: ["food", "restaurant", "grocery", "dining", "cafe", "coffee", "meal", "lunch", "dinner", "breakfast"],
  transport: ["transport", "uber", "lyft", "taxi", "gas", "fuel", "parking", "train", "bus", "metro"],
  entertainment: ["entertainment", "movie", "netflix", "spotify", "game", "concert", "theatre", "streaming"],
  shopping: ["shopping", "amazon", "store", "mall", "clothing", "electronics", "purchase"],
  utilities: ["utility", "utilities", "electric", "water", "internet", "phone", "bill", "subscription"],
  health: ["health", "medical", "pharmacy", "doctor", "hospital", "gym", "fitness", "insurance"],
  education: ["education", "school", "course", "book", "tuition", "training", "learning"],
  other: [],
};

export function useCSVImport() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (content: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    // Parse header
    const headerLine = lines[0];
    const parsedHeaders = parseCSVLine(headerLine);

    // Parse data rows
    const parsedRows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === parsedHeaders.length) {
        const row: CSVRow = {};
        parsedHeaders.forEach((header, index) => {
          row[header] = values[index];
        });
        parsedRows.push(row);
      }
    }

    return { headers: parsedHeaders, rows: parsedRows };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const handleFileUpload = async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const content = await file.text();
      const { headers: parsedHeaders, rows: parsedRows } = parseCSV(content);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
      setHeaders([]);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectCategory = (text: string): ExpenseCategory => {
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }
    
    return "other";
  };

  const parseDate = (dateStr: string): string | null => {
    // Try various date formats
    const formats = [
      // ISO format
      /^(\d{4})-(\d{2})-(\d{2})$/,
      // US format MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // EU format DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // US format MM-DD-YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    ];

    // Try ISO format first
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Try MM/DD/YYYY or DD/MM/YYYY
    const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const [, first, second, year] = slashMatch;
      // Assume MM/DD/YYYY format (US)
      const month = first.padStart(2, "0");
      const day = second.padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Try to parse with Date constructor as fallback
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }

    return null;
  };

  const parseAmount = (amountStr: string): number | null => {
    // Remove currency symbols and whitespace
    const cleaned = amountStr.replace(/[^0-9.,\-]/g, "").trim();
    
    // Handle negative amounts (debits)
    const isNegative = amountStr.includes("-") || amountStr.includes("(");
    
    // Handle comma as decimal separator (European format)
    let normalized = cleaned;
    if (cleaned.includes(",") && !cleaned.includes(".")) {
      normalized = cleaned.replace(",", ".");
    } else if (cleaned.includes(",") && cleaned.includes(".")) {
      // Assume comma is thousands separator
      normalized = cleaned.replace(",", "");
    }
    
    const amount = parseFloat(normalized);
    if (isNaN(amount)) return null;
    
    return Math.abs(amount);
  };

  const mapToExpenses = (mapping: ColumnMapping): ParsedExpense[] => {
    return rows.map(row => {
      const errors: string[] = [];
      
      // Parse amount
      const amountStr = row[mapping.amount] || "";
      const amount = parseAmount(amountStr);
      if (amount === null) {
        errors.push(`Invalid amount: "${amountStr}"`);
      }
      
      // Parse date
      const dateStr = row[mapping.date] || "";
      const date = parseDate(dateStr);
      if (!date) {
        errors.push(`Invalid date: "${dateStr}"`);
      }
      
      // Parse category
      let category: ExpenseCategory = "other";
      if (mapping.category && row[mapping.category]) {
        const categoryStr = row[mapping.category].toLowerCase();
        if (Object.keys(CATEGORY_KEYWORDS).includes(categoryStr)) {
          category = categoryStr as ExpenseCategory;
        } else {
          category = detectCategory(categoryStr);
        }
      } else if (mapping.description && row[mapping.description]) {
        category = detectCategory(row[mapping.description]);
      }
      
      // Get description
      const description = mapping.description ? row[mapping.description] || "" : "";
      
      return {
        amount: amount || 0,
        date: date || new Date().toISOString().split("T")[0],
        category,
        description,
        isValid: errors.length === 0,
        errors,
      };
    });
  };

  const reset = () => {
    setHeaders([]);
    setRows([]);
    setError(null);
  };

  return {
    headers,
    rows,
    isLoading,
    error,
    handleFileUpload,
    mapToExpenses,
    reset,
  };
}
