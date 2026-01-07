import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Expense, ExpenseCategory } from "@/lib/types";
import { formatCurrency, Currency } from "@/lib/currencies";
import { format } from "date-fns";

interface CategoryConfig {
  label: string;
  color: string;
}

interface ExportOptions {
  expenses: Expense[];
  currency: Currency;
  getCategoryConfig: (category: ExpenseCategory) => CategoryConfig;
  aiInsights?: string | null;
}

export function exportToPDF({ expenses, currency, getCategoryConfig, aiInsights }: ExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Report", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, pageWidth / 2, yPos, { align: "center" });
  doc.setTextColor(0);
  yPos += 15;

  // Summary Section
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgPerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Expenses: ${expenses.length} transactions`, 14, yPos);
  yPos += 6;
  doc.text(`Total Amount: ${formatCurrency(totalSpent, currency)}`, 14, yPos);
  yPos += 6;
  doc.text(`Average per Transaction: ${formatCurrency(avgPerExpense, currency)}`, 14, yPos);
  yPos += 12;

  // Category Breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category: category as ExpenseCategory,
      amount,
      percentage: totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : "0",
      config: getCategoryConfig(category as ExpenseCategory),
    }));

  if (sortedCategories.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Category Breakdown", 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [["Category", "Amount", "Percentage"]],
      body: sortedCategories.map((c) => [
        c.config.label,
        formatCurrency(c.amount, currency),
        `${c.percentage}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // AI Insights Section
  if (aiInsights) {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("AI Insights", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Clean markdown formatting for PDF
    const cleanInsights = aiInsights
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\*\*/g, "") // Remove bold
      .replace(/\*/g, "") // Remove italic
      .replace(/`/g, "") // Remove code
      .replace(/- /g, "• "); // Replace dashes with bullets

    const splitInsights = doc.splitTextToSize(cleanInsights, pageWidth - 28);
    
    splitInsights.forEach((line: string) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 14, yPos);
      yPos += 5;
    });

    yPos += 7;
  }

  // Expense Details Table
  if (expenses.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Transaction Details", 14, yPos);
    yPos += 8;

    const sortedExpenses = [...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    autoTable(doc, {
      startY: yPos,
      head: [["Date", "Category", "Description", "Amount"]],
      body: sortedExpenses.map((e) => [
        format(new Date(e.date), "MMM d, yyyy"),
        getCategoryConfig(e.category).label,
        e.description || "-",
        formatCurrency(Number(e.amount), currency),
      ]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 35, halign: "right" },
      },
    });
  }

  // Save
  const fileName = `expense-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(fileName);
}

export function exportToCSV({ expenses, currency, getCategoryConfig }: Omit<ExportOptions, 'aiInsights'>) {
  const headers = ["Date", "Category", "Description", "Amount"];
  
  const rows = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((e) => [
      format(new Date(e.date), "yyyy-MM-dd"),
      getCategoryConfig(e.category).label,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      Number(e.amount).toFixed(2),
    ]);

  // Add summary rows
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  rows.push([], ["Total", "", "", totalSpent.toFixed(2)]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
