/**
 * Wealthly Data Export Library
 * Handles export to CSV, JSON, Excel, and PDF formats.
 * All processing happens client-side for privacy.
 */

export type ExportFormat = "csv" | "json" | "excel" | "pdf";

export interface ExportData {
  user: any;
  transactions: any[];
  categories: any[];
  bankAccounts: any[];
  investments: any[];
  assets: any[];
  debts: any[];
  goals: any[];
  zakatSettings?: any;
  exportedAt: string;
  appVersion: string;
}

export async function fetchAllUserData(): Promise<ExportData> {
  const fetchOpts = { credentials: "include" as const };

  const [user, transactions, categories, bankAccounts, investments, assets, debts, goals] =
    await Promise.all([
      fetch("/api/auth/user", fetchOpts).then(r => r.json()),
      fetch("/api/transactions", fetchOpts).then(r => r.json()),
      fetch("/api/categories", fetchOpts).then(r => r.json()),
      fetch("/api/bank-accounts", fetchOpts).then(r => r.json()),
      fetch("/api/investments", fetchOpts).then(r => r.json()),
      fetch("/api/assets", fetchOpts).then(r => r.json()),
      fetch("/api/debts", fetchOpts).then(r => r.json()),
      fetch("/api/goals", fetchOpts).then(r => r.json()),
    ]);

  let zakatSettings = null;
  try {
    const r = await fetch("/api/zakat/settings", fetchOpts);
    if (r.ok) zakatSettings = await r.json();
  } catch {}

  return {
    user: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      currency: user.currency,
      language: user.language,
    },
    transactions: Array.isArray(transactions) ? transactions : [],
    categories: Array.isArray(categories) ? categories : [],
    bankAccounts: Array.isArray(bankAccounts) ? bankAccounts : [],
    investments: Array.isArray(investments) ? investments : [],
    assets: Array.isArray(assets) ? assets : [],
    debts: Array.isArray(debts) ? debts : [],
    goals: Array.isArray(goals) ? goals : [],
    zakatSettings,
    exportedAt: new Date().toISOString(),
    appVersion: "1.0.0",
  };
}

export function exportToCSV(data: ExportData): string {
  const lines: string[] = [];

  lines.push(`Wealthly Data Export`);
  lines.push(`Exported: ${data.exportedAt}`);
  lines.push(`User: ${data.user.firstName} ${data.user.lastName} (${data.user.email})`);
  lines.push("");

  const esc = (v: any): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const section = (title: string, headers: string[], rows: any[][]) => {
    lines.push(`### ${title} ###`);
    lines.push(headers.map(esc).join(","));
    rows.forEach(row => lines.push(row.map(esc).join(",")));
    lines.push("");
  };

  section(
    "Transactions",
    ["Date", "Description", "Amount", "Type", "Category", "Notes"],
    data.transactions.map(t => {
      const cat = data.categories.find(c => c.id === t.categoryId);
      return [t.date, t.description, t.amount, cat?.type || "", cat?.name || "", t.notes || ""];
    })
  );

  section(
    "Categories",
    ["Name", "Type", "Color", "Budget"],
    data.categories.map(c => [c.name, c.type, c.color, c.budget || ""])
  );

  section(
    "Bank Accounts",
    ["Bank", "Account Name", "Type", "Balance", "Currency"],
    data.bankAccounts.map(b => [b.bankName, b.accountName, b.accountType, b.balance, b.currency])
  );

  section(
    "Investments",
    ["Type", "Name", "Quantity", "Purchase Price", "Current Value", "Purchase Date"],
    data.investments.map(i => [i.type, i.name || "", i.quantity, i.purchasePrice, i.currentValue, i.purchaseDate])
  );

  section(
    "Assets",
    ["Name", "Type", "Purchase Price", "Current Value", "Location"],
    data.assets.map(a => [a.name, a.type, a.purchasePrice, a.currentValue, a.location || ""])
  );

  section(
    "Debts",
    ["Name", "Type", "Principal", "Remaining", "Monthly Payment", "Due Date", "Status"],
    data.debts.map(d => [d.name || d.creditor, d.type || d.debtType, d.principal, d.remainingAmount, d.monthlyPayment || "", d.dueDate || "", d.status])
  );

  section(
    "Goals",
    ["Name", "Target Amount", "Current Amount", "Deadline", "Status"],
    data.goals.map(g => [g.name, g.targetAmount, g.currentAmount, g.deadline || "", g.status])
  );

  return "\uFEFF" + lines.join("\n");
}

export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export async function exportToExcel(data: ExportData): Promise<Blob> {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  const metaData = [
    ["Wealthly Data Export"],
    ["Exported At", data.exportedAt],
    ["User", `${data.user.firstName} ${data.user.lastName}`],
    ["Email", data.user.email],
    ["Currency", data.user.currency],
    [],
    ["Total Transactions", data.transactions.length],
    ["Total Accounts", data.bankAccounts.length],
    ["Total Investments", data.investments.length],
    ["Total Goals", data.goals.length],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(metaData), "Summary");

  if (data.transactions.length > 0) {
    const txRows = data.transactions.map(t => {
      const cat = data.categories.find(c => c.id === t.categoryId);
      return {
        Date: t.date,
        Description: t.description,
        Amount: Number(t.amount),
        Type: cat?.type || "",
        Category: cat?.name || "",
        Notes: t.notes || "",
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), "Transactions");
  }

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.categories.map(c => ({
    Name: c.name, Type: c.type, Color: c.color,
  }))), "Categories");

  if (data.bankAccounts.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.bankAccounts.map(b => ({
      Bank: b.bankName, "Account Name": b.accountName, Type: b.accountType,
      Balance: Number(b.balance), Currency: b.currency,
    }))), "Bank Accounts");
  }

  if (data.investments.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.investments.map(i => ({
      Type: i.type, Name: i.name,
      Quantity: Number(i.quantity || 0),
      "Purchase Price": Number(i.purchasePrice || 0),
      "Current Value": Number(i.currentValue || 0),
      "Purchase Date": i.purchaseDate,
    }))), "Investments");
  }

  if (data.assets.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.assets.map(a => ({
      Name: a.name, Type: a.type,
      "Purchase Price": Number(a.purchasePrice || 0),
      "Current Value": Number(a.currentValue || 0),
      Location: a.location,
    }))), "Assets");
  }

  if (data.debts.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.debts.map(d => ({
      Name: d.name || d.creditor, Type: d.type || d.debtType,
      Principal: Number(d.principal || 0),
      Remaining: Number(d.remainingAmount || 0),
      "Monthly Payment": Number(d.monthlyPayment || 0),
      "Due Date": d.dueDate, Status: d.status,
    }))), "Debts");
  }

  if (data.goals.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.goals.map(g => ({
      Name: g.name,
      "Target Amount": Number(g.targetAmount || 0),
      "Current Amount": Number(g.currentAmount || 0),
      Deadline: g.deadline, Status: g.status,
    }))), "Goals");
  }

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function exportToPDF(data: ExportData): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(20);
  doc.setTextColor(27, 79, 228);
  doc.text("Wealthly Data Export", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Exported: ${new Date(data.exportedAt).toLocaleString()}`, 14, y);
  y += 6;
  doc.text(`User: ${data.user.firstName} ${data.user.lastName} (${data.user.email})`, 14, y);
  y += 12;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 41);
  doc.text("Summary", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Item", "Count"]],
    body: [
      ["Transactions", String(data.transactions.length)],
      ["Categories", String(data.categories.length)],
      ["Bank Accounts", String(data.bankAccounts.length)],
      ["Investments", String(data.investments.length)],
      ["Assets", String(data.assets.length)],
      ["Debts", String(data.debts.length)],
      ["Goals", String(data.goals.length)],
    ],
    theme: "striped",
    headStyles: { fillColor: [27, 79, 228] },
    margin: { left: 14, right: 14 },
  });

  if (data.transactions.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 41);
    doc.text("Transactions", 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Description", "Category", "Amount"]],
      body: data.transactions.slice(0, 100).map(t => {
        const cat = data.categories.find(c => c.id === t.categoryId);
        return [
          t.date ? new Date(t.date).toLocaleDateString() : "",
          (t.description || "").slice(0, 40),
          cat?.name || "",
          `${cat?.type === "income" ? "+" : "-"}${Number(t.amount).toFixed(2)} ${data.user.currency}`,
        ];
      }),
      theme: "striped",
      headStyles: { fillColor: [27, 79, 228] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9 },
    });

    if (data.transactions.length > 100) {
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`... and ${data.transactions.length - 100} more transactions (see CSV for full list)`, 14, finalY + 8);
    }
  }

  if (data.bankAccounts.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 41);
    doc.text("Bank Accounts", 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [["Bank", "Account", "Type", "Balance"]],
      body: data.bankAccounts.map(b => [
        b.bankName, b.accountName, b.accountType,
        `${Number(b.balance).toFixed(2)} ${b.currency}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [27, 79, 228] },
      margin: { left: 14, right: 14 },
    });
  }

  if (data.goals.length > 0) {
    const lastY = (doc as any).lastAutoTable?.finalY || 200;
    const startGoalsY = lastY + 20;
    if (startGoalsY > 250) doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 41);
    doc.text("Goals", 14, startGoalsY > 250 ? 20 : startGoalsY);
    autoTable(doc, {
      startY: startGoalsY > 250 ? 28 : startGoalsY + 8,
      head: [["Goal", "Current", "Target", "Progress"]],
      body: data.goals.map(g => {
        const progress = Number(g.targetAmount) > 0
          ? (Number(g.currentAmount) / Number(g.targetAmount) * 100).toFixed(0)
          : "0";
        return [g.name, `${Number(g.currentAmount).toFixed(2)}`, `${Number(g.targetAmount).toFixed(2)}`, `${progress}%`];
      }),
      theme: "striped",
      headStyles: { fillColor: [27, 79, 228] },
      margin: { left: 14, right: 14 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Wealthly • Page ${i} of ${pageCount} • Exported ${new Date(data.exportedAt).toLocaleDateString()}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  return doc.output("blob");
}

export function downloadFile(content: string | Blob, filename: string, mimeType?: string) {
  const blob = typeof content === "string"
    ? new Blob([content], { type: mimeType || "text/plain" })
    : content;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportUserData(format: ExportFormat): Promise<void> {
  const data = await fetchAllUserData();
  const timestamp = new Date().toISOString().split("T")[0];
  const base = `wealthly-export-${timestamp}`;

  switch (format) {
    case "csv": {
      downloadFile(exportToCSV(data), `${base}.csv`, "text/csv;charset=utf-8");
      break;
    }
    case "json": {
      downloadFile(exportToJSON(data), `${base}.json`, "application/json");
      break;
    }
    case "excel": {
      const blob = await exportToExcel(data);
      downloadFile(blob, `${base}.xlsx`);
      break;
    }
    case "pdf": {
      const blob = await exportToPDF(data);
      downloadFile(blob, `${base}.pdf`);
      break;
    }
  }
}
