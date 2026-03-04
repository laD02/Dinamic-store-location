// app/utils/exportDetailPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface DetailTrendRow {
    date: string;
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

export interface DetailConversionRow {
    date: string;
    uniqueViewSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

export interface DetailTotals {
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

export interface DetailStoreInfo {
    storeName?: string;
    address?: string;
    city?: string;
    region?: string;
    code?: string;
}

export interface ExportDetailPDFOptions {
    store: DetailStoreInfo | null;
    totals: DetailTotals;
    chartHeadings: { trend: string; conversion: string };
    dailyTrend: DetailTrendRow[];
    conversionTrend: DetailConversionRow[];
}

function addPageHeader(doc: jsPDF, pageW: number, title: string, dateStr: string) {
    doc.setFillColor(79, 110, 247);
    doc.rect(0, 0, pageW, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 10);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(dateStr, pageW - 14, 10, { align: "right" });
}

const convRate = (n: number, views: number) =>
    views > 0 ? `${((n / views) * 100).toFixed(1)}%` : "—";

/**
 * Export single-store analytics data to a PDF.
 * Page 1: Summary cards + Activity Trend table
 * Page 2: Conversion Trend table
 */
export function exportDetailToPDF(options: ExportDetailPDFOptions): boolean {
    const { store, totals, chartHeadings, dailyTrend, conversionTrend } = options;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = 297;
    const pageH = 210;
    const margin = 14;

    const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    const storeName = store?.storeName ?? "Store";
    const storeLocation = [store?.address, store?.city, store?.region, store?.code].filter(Boolean).join(", ");

    // ── PAGE 1: Summary + Trend ────────────────────────────────────
    addPageHeader(doc, pageW, `${storeName} — Analytics Report`, dateStr);

    // Store location subtitle
    if (storeLocation) {
        doc.setTextColor(220, 230, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(storeLocation, 14, 13.5);
    }

    // Summary cards
    const metrics = [
        { label: "Views", value: totals.uniqueViewSessions, color: [79, 110, 247] as [number, number, number] },
        { label: "Searches", value: totals.uniqueSearchSessions, color: [245, 158, 11] as [number, number, number] },
        { label: "Phone Clicks", value: totals.uniqueCallSessions, color: [16, 185, 129] as [number, number, number] },
        { label: "Directions", value: totals.uniqueDirectionSessions, color: [239, 68, 68] as [number, number, number] },
        { label: "Website Clicks", value: totals.uniqueWebsiteSessions, color: [139, 92, 246] as [number, number, number] },
    ];

    // Summary cards (Row 1)
    const cardW = 50, cardH = 16, cardGap = 8, startX = margin, startY = 18;
    metrics.forEach((m, i) => {
        const x = startX + i * (cardW + cardGap);
        const [r, g, b] = m.color;
        doc.setFillColor(r, g, b);
        doc.roundedRect(x, startY, cardW, cardH, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(m.label, x + 3, startY + 5);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(String(m.value), x + 3, startY + 13);
    });

    // Conversion rate boxes (Row 2)
    const views = totals.uniqueViewSessions;
    const convMetrics = [
        { label: "Phone Conv.", value: convRate(totals.uniqueCallSessions, views), color: [16, 185, 129] as [number, number, number] },
        { label: "Direction Conv.", value: convRate(totals.uniqueDirectionSessions, views), color: [239, 68, 68] as [number, number, number] },
        { label: "Website Conv.", value: convRate(totals.uniqueWebsiteSessions, views), color: [139, 92, 246] as [number, number, number] },
    ];
    const convCardW = 58, convY = 38;
    // Center the conversion cards
    const convTotalW = convMetrics.length * convCardW + (convMetrics.length - 1) * cardGap;
    const convStartX = (pageW - convTotalW) / 2;

    convMetrics.forEach((m, i) => {
        const x = convStartX + i * (convCardW + cardGap);
        const [r, g, b] = m.color;
        // Light background using jspdf built-in means or just very light RGB
        doc.setFillColor(Math.min(r + 210, 255), Math.min(g + 210, 255), Math.min(b + 210, 255));
        doc.setDrawColor(r, g, b);
        doc.roundedRect(x, convY, convCardW, cardH, 3, 3, "FD");
        doc.setTextColor(r, g, b);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(m.label, x + 3, convY + 5);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(m.value, x + 3, convY + 13);
    });

    // Activity Trend table
    if (dailyTrend && dailyTrend.length > 0) {
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(chartHeadings.trend, margin, 58);

        autoTable(doc, {
            startY: 62,
            head: [["Date", "Views", "Searches", "Phone", "Directions", "Website"]],
            body: dailyTrend.map(r => [
                r.date,
                r.uniqueViewSessions,
                r.uniqueSearchSessions,
                r.uniqueCallSessions,
                r.uniqueDirectionSessions,
                r.uniqueWebsiteSessions,
            ]),
            theme: "grid",
            styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 30, 30], lineColor: [229, 231, 235], lineWidth: 0.3 },
            headStyles: { fillColor: [79, 110, 247], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
            columnStyles: {
                0: { cellWidth: 28 },
                1: { halign: "center" }, 2: { halign: "center" },
                3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" },
            },
            alternateRowStyles: { fillColor: [248, 249, 255] },
        });
    }

    // ── PAGE 2: Conversion Trend ───────────────────────────────────
    doc.addPage();
    addPageHeader(doc, pageW, `${storeName} — Conversion Trend`, dateStr);

    if (conversionTrend && conversionTrend.length > 0) {
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(chartHeadings.conversion, margin, 22);

        autoTable(doc, {
            startY: 25,
            head: [["Date", "Views", "Phone Clicks", "Phone Conv.", "Directions", "Dir. Conv.", "Website", "Web Conv."]],
            body: conversionTrend.map(r => [
                r.date,
                r.uniqueViewSessions,
                r.uniqueCallSessions,
                convRate(r.uniqueCallSessions, r.uniqueViewSessions),
                r.uniqueDirectionSessions,
                convRate(r.uniqueDirectionSessions, r.uniqueViewSessions),
                r.uniqueWebsiteSessions,
                convRate(r.uniqueWebsiteSessions, r.uniqueViewSessions),
            ]),
            theme: "grid",
            styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 30, 30], lineColor: [229, 231, 235], lineWidth: 0.3 },
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
            columnStyles: {
                0: { cellWidth: 28 },
                3: { halign: "center", textColor: [16, 130, 90] },
                5: { halign: "center", textColor: [16, 130, 90] },
                7: { halign: "center", textColor: [16, 130, 90] },
                1: { halign: "center" }, 2: { halign: "center" },
                4: { halign: "center" }, 6: { halign: "center" },
            },
            alternateRowStyles: { fillColor: [240, 255, 249] },
        });
    }

    // ── Page numbers ──────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} of ${pageCount}`, pageW / 2, pageH - 3, { align: "center" });
    }

    const slug = storeName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    doc.save(`analytics_${slug}_${new Date().toISOString().split("T")[0]}.pdf`);
    return true;
}
