/**
 * Export utilities for CSV and data export
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: Array<{ key: string; label: string; accessor: (row: T) => string | number }>,
  filename: string = "export"
) {
  // Create CSV header
  const headers = columns.map((col) => col.label).join(",");
  
  // Create CSV rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = col.accessor(row);
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",")
  );

  // Combine header and rows
  const csvContent = [headers, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function formatDateForExport(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatCurrencyForExport(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

