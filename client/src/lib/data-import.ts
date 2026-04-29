/**
 * Wealthly Data Import Library
 * Imports transactions from CSV files and other apps.
 */

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ImportPreview {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
  detectedFormat: "wealthly" | "mint" | "ynab" | "personal-capital" | "quicken" | "generic";
  suggestedMapping: Record<string, string>;
}

export async function parseCSVFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const Papa = (await import("papaparse")).default;

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results: any) => {
        const allRows = results.data as string[][];
        if (allRows.length === 0) return reject(new Error("Empty file"));
        const headers = allRows[0];
        const rows = allRows.slice(1);
        resolve({ headers, rows });
      },
      error: reject,
    });
  });
}

export function detectFormat(headers: string[]): ImportPreview["detectedFormat"] {
  const lower = headers.map(h => h.toLowerCase().trim());
  const hasAll = (...keys: string[]) => keys.every(k => lower.some(h => h.includes(k)));

  if (hasAll("date", "description", "amount", "category") && lower.some(h => h.includes("notes"))) {
    return "wealthly";
  }
  if (hasAll("date", "description", "amount") && lower.some(h => h.includes("transaction type"))) {
    return "mint";
  }
  if (hasAll("date", "payee", "outflow")) {
    return "ynab";
  }
  if (hasAll("date", "transaction") && lower.some(h => h.includes("amount"))) {
    return "personal-capital";
  }
  if (hasAll("num", "date", "description")) {
    return "quicken";
  }
  return "generic";
}

export function suggestMapping(headers: string[], _format: ImportPreview["detectedFormat"]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lower = headers.map(h => h.toLowerCase().trim());

  const findIdx = (patterns: string[]): number => {
    for (const p of patterns) {
      const idx = lower.findIndex(h => h.includes(p));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const dateIdx = findIdx(["date", "transaction date", "post date"]);
  if (dateIdx !== -1) mapping[headers[dateIdx]] = "date";

  const descIdx = findIdx(["description", "memo", "payee", "merchant"]);
  if (descIdx !== -1) mapping[headers[descIdx]] = "description";

  const amountIdx = findIdx(["amount"]);
  if (amountIdx !== -1) mapping[headers[amountIdx]] = "amount";

  const categoryIdx = findIdx(["category"]);
  if (categoryIdx !== -1) mapping[headers[categoryIdx]] = "category";

  const notesIdx = findIdx(["notes", "note"]);
  if (notesIdx !== -1) mapping[headers[notesIdx]] = "notes";

  return mapping;
}

export async function previewImport(file: File): Promise<ImportPreview> {
  const { headers, rows } = await parseCSVFile(file);
  const format = detectFormat(headers);
  const mapping = suggestMapping(headers, format);

  return {
    headers,
    sampleRows: rows.slice(0, 5),
    totalRows: rows.length,
    detectedFormat: format,
    suggestedMapping: mapping,
  };
}

export async function importTransactions(
  file: File,
  mapping: Record<string, string>
): Promise<ImportResult> {
  const { headers, rows } = await parseCSVFile(file);

  const dateCol = headers.findIndex(h => mapping[h] === "date");
  const descCol = headers.findIndex(h => mapping[h] === "description");
  const amountCol = headers.findIndex(h => mapping[h] === "amount");
  const categoryCol = headers.findIndex(h => mapping[h] === "category");
  const notesCol = headers.findIndex(h => mapping[h] === "notes");

  if (dateCol === -1 || amountCol === -1) {
    return {
      success: false,
      imported: 0,
      skipped: rows.length,
      errors: ["Missing required columns: date and amount"],
    };
  }

  const categoriesRes = await fetch("/api/categories", { credentials: "include" });
  const categories = await categoriesRes.json();

  const transactions: any[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const dateStr = row[dateCol]?.trim();
      const amountStr = row[amountCol]?.trim().replace(/[^0-9.\-]/g, "");
      const description = descCol !== -1 ? row[descCol]?.trim() : "";
      const categoryName = categoryCol !== -1 ? row[categoryCol]?.trim() : "";
      const notes = notesCol !== -1 ? row[notesCol]?.trim() : "";

      if (!dateStr || !amountStr) { skipped++; continue; }

      let date: Date | null = null;
      const fmts = [
        () => new Date(dateStr),
        () => {
          const [m, d, y] = dateStr.split("/");
          return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        },
        () => {
          const [d, m, y] = dateStr.split("/");
          return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        },
      ];
      for (const fmt of fmts) {
        try { const dd = fmt(); if (!isNaN(dd.getTime())) { date = dd; break; } } catch {}
      }
      if (!date) { skipped++; continue; }

      const amount = Math.abs(parseFloat(amountStr));
      if (isNaN(amount)) { skipped++; continue; }

      const isExpense = amountStr.startsWith("-") || parseFloat(amountStr) < 0;

      let category = categories.find((c: any) =>
        c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (!category) {
        category = categories.find((c: any) => c.type === (isExpense ? "expense" : "income"));
      }
      if (!category) { skipped++; continue; }

      transactions.push({
        date: date.toISOString(),
        description: description || "Imported",
        amount: amount.toFixed(2),
        categoryId: category.id,
        notes: notes || null,
      });
    } catch (e: any) {
      errors.push(`Row ${i + 2}: ${e.message}`);
      skipped++;
    }
  }

  if (transactions.length === 0) {
    return {
      success: false,
      imported: 0,
      skipped,
      errors: errors.length ? errors : ["No valid transactions found"],
    };
  }

  const res = await fetch("/api/transactions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ transactions }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      success: false,
      imported: 0,
      skipped: rows.length,
      errors: [data.error || "Server error during import"],
    };
  }

  const result = await res.json();
  return {
    success: true,
    imported: result.imported || transactions.length,
    skipped,
    errors,
  };
}
