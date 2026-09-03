import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CompanyProfile } from "@/lib/company";

export interface ReportSummaryItem {
  label: string;
  value: string;
}

export interface ReportDefinition {
  /** Nome do relatório (ex: "Relatório de Vendas") */
  title: string;
  /** Linha auxiliar: período, filtros, etc. */
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: ReportSummaryItem[];
  /** Nome do arquivo sem extensão */
  fileName: string;
}

export interface ReportBranding {
  company: CompanyProfile | null;
  logoDataUrl: string | null;
}

const GOLD: [number, number, number] = [212, 175, 55];
const DARK: [number, number, number] = [15, 15, 15];

const contactLine = (c: CompanyProfile | null) => {
  if (!c) return "";
  return [c.cnpj && `CNPJ: ${c.cnpj}`, c.address, c.phone, c.email]
    .filter(Boolean)
    .join("  ·  ");
};

/** Gera e baixa o PDF do relatório usando a identidade da empresa cadastrada. */
export function exportReportPdf(report: ReportDefinition, branding: ReportBranding) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;

  const company = branding.company;
  const companyName = company?.name?.trim() || "";
  const footerText = contactLine(company);

  let headerBottom = margin;

  // ---------- Cabeçalho ----------
  let textX = margin;
  if (branding.logoDataUrl) {
    try {
      const format = branding.logoDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(branding.logoDataUrl, format, margin, margin - 6, 54, 54, undefined, "FAST");
      textX = margin + 68;
    } catch (err) {
      console.error("Não foi possível inserir a logo no PDF:", err);
    }
  }

  if (companyName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...DARK);
    doc.text(companyName, textX, margin + 12);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(companyName ? 11 : 15);
  doc.setTextColor(...DARK);
  doc.text(report.title, textX, margin + (companyName ? 30 : 12));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const generatedAt = new Date().toLocaleString("pt-BR");
  const infoLine = [report.subtitle, `Emitido em ${generatedAt}`].filter(Boolean).join("  ·  ");
  doc.text(infoLine, textX, margin + (companyName ? 44 : 28));

  headerBottom = margin + (companyName ? 56 : 40);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.line(margin, headerBottom, pageWidth - margin, headerBottom);

  let cursorY = headerBottom + 18;

  // ---------- Indicadores ----------
  if (report.summary && report.summary.length > 0) {
    const gap = 10;
    const boxWidth = (pageWidth - margin * 2 - gap * (report.summary.length - 1)) / report.summary.length;
    report.summary.forEach((item, i) => {
      const x = margin + i * (boxWidth + gap);
      doc.setFillColor(246, 246, 246);
      doc.roundedRect(x, cursorY, boxWidth, 40, 4, 4, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(item.label.toUpperCase(), x + 8, cursorY + 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...DARK);
      doc.text(item.value, x + 8, cursorY + 31);
    });
    cursorY += 56;
  }

  // ---------- Tabela ----------
  autoTable(doc, {
    startY: cursorY,
    head: [report.columns],
    body: report.rows.length > 0 ? report.rows.map((r) => r.map(String)) : [
      report.columns.map((_, i) => (i === 0 ? "Nenhum registro no período selecionado." : "")),
    ],
    margin: { left: margin, right: margin, bottom: margin + 24 },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [40, 40, 40] },
    headStyles: { fillColor: DARK, textColor: GOLD, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: "grid",
  });

  // ---------- Rodapé ----------
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - margin - 14, pageWidth - margin, pageHeight - margin - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    if (footerText) doc.text(footerText, margin, pageHeight - margin);
    doc.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - margin, {
      align: "right",
    });
  }

  doc.save(`${report.fileName}.pdf`);
}
