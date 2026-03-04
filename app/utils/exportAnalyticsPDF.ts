// app/utils/exportAnalyticsPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AnalyticsStoreRow {
    storeId?: string;
    store?: {
        id?: string;
        storeName?: string;
        address?: string;
        city?: string;
        region?: string;
    };
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

export interface TrendRow {
    date: string;
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

export interface ConversionRow {
    date: string;
    uniqueViewSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

export interface TopStoreRow {
    name: string;
    Views: number;
    Searches: number;
    Phone: number;
    Directions: number;
    Website: number;
}

type OverallTotals = {
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
};

interface ChartHeadings {
    trend: string;
    conversion: string;
    topStores: string;
}

interface ExportOptions {
    overallTotals?: OverallTotals;
    chartHeadings?: ChartHeadings;
    dailyTotals?: TrendRow[];
    conversionTotals?: ConversionRow[];
    top5Stores?: TopStoreRow[];
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

export function exportAnalyticsToPDF(
    stores: AnalyticsStoreRow[],
    options: ExportOptions = {}
): boolean {
    if (!stores || stores.length === 0) return false;

    const { overallTotals, chartHeadings, dailyTotals, conversionTotals, top5Stores } = options;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = 297;
    const pageH = 210;
    const margin = 14;

    const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    const convRate = (n: number, views: number) =>
        views > 0 ? `${((n / views) * 100).toFixed(1)}%` : "—";

    // ── PAGE 1: Summary + Trend table ─────────────────────────────
    addPageHeader(doc, pageW, "Store Locator — Analytics Report", dateStr);

    // Summary cards (Row 1)
    if (overallTotals) {
        const metrics = [
            { label: "Views", value: overallTotals.uniqueViewSessions, color: [79, 110, 247] as [number, number, number] },
            { label: "Searches", value: overallTotals.uniqueSearchSessions, color: [245, 158, 11] as [number, number, number] },
            { label: "Phone Clicks", value: overallTotals.uniqueCallSessions, color: [16, 185, 129] as [number, number, number] },
            { label: "Directions", value: overallTotals.uniqueDirectionSessions, color: [239, 68, 68] as [number, number, number] },
            { label: "Website Clicks", value: overallTotals.uniqueWebsiteSessions, color: [139, 92, 246] as [number, number, number] },
        ];
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
        const views = overallTotals.uniqueViewSessions;
        const convMetrics = [
            { label: "Phone Conv.", value: convRate(overallTotals.uniqueCallSessions, views), color: [16, 185, 129] as [number, number, number] },
            { label: "Direction Conv.", value: convRate(overallTotals.uniqueDirectionSessions, views), color: [239, 68, 68] as [number, number, number] },
            { label: "Website Conv.", value: convRate(overallTotals.uniqueWebsiteSessions, views), color: [139, 92, 246] as [number, number, number] },
        ];
        const convCardW = 58, convY = 38;
        // Center the conversion cards
        const convTotalW = convMetrics.length * convCardW + (convMetrics.length - 1) * cardGap;
        const convStartX = (pageW - convTotalW) / 2;

        convMetrics.forEach((m, i) => {
            const x = convStartX + i * (convCardW + cardGap);
            const [r, g, b] = m.color;
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
    }

    // Trend data table
    if (dailyTotals && dailyTotals.length > 0) {
        const heading = chartHeadings?.trend ?? "Activity Trend";
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(heading, margin, 58);

        autoTable(doc, {
            startY: 62,
            head: [["Date", "Views", "Searches", "Phone", "Directions", "Website"]],
            body: dailyTotals.map(r => [
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

    // ── PAGE 2: Conversion + Top Stores ───────────────────────────
    doc.addPage();
    addPageHeader(doc, pageW, "Conversion & Top Stores", dateStr);

    let nextY = 18;

    if (conversionTotals && conversionTotals.length > 0) {
        const heading = chartHeadings?.conversion ?? "Conversion Trend";
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(heading, margin, nextY + 4);

        autoTable(doc, {
            startY: nextY + 7,
            head: [["Date", "Views", "Phone Clicks", "Phone Conv.", "Directions", "Dir. Conv.", "Website", "Web Conv."]],
            body: conversionTotals.map(r => [
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

        nextY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (top5Stores && top5Stores.length > 0) {
        const heading = chartHeadings?.topStores ?? "Top Stores";
        if (nextY > pageH - 50) { doc.addPage(); addPageHeader(doc, pageW, heading, dateStr); nextY = 18; }

        doc.setTextColor(30, 30, 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(heading, margin, nextY + 4);

        autoTable(doc, {
            startY: nextY + 7,
            head: [["Store Name", "Views", "Searches", "Phone", "Directions", "Website", "Total"]],
            body: top5Stores.map(s => [
                s.name,
                s.Views, s.Searches, s.Phone, s.Directions, s.Website,
                s.Views + s.Searches + s.Phone + s.Directions + s.Website,
            ]),
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 3, textColor: [30, 30, 30], lineColor: [229, 231, 235], lineWidth: 0.3 },
            headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
            columnStyles: {
                0: { cellWidth: 55 },
                1: { halign: "center" }, 2: { halign: "center" },
                3: { halign: "center" }, 4: { halign: "center" },
                5: { halign: "center" }, 6: { halign: "center", fontStyle: "bold" },
            },
            alternateRowStyles: { fillColor: [248, 245, 255] },
        });
    }

    // ── PAGE 3: Full Store Table ───────────────────────────────────
    doc.addPage();
    addPageHeader(doc, pageW, "Store Analytics Detail", dateStr);

    autoTable(doc, {
        startY: 18,
        head: [["Store Name", "City", "Country", "Views", "Searches", "Phone", "Directions", "Website", "Phone Conv.", "Dir. Conv.", "Web Conv."]],
        body: stores.map(item => {
            const views = item.uniqueViewSessions ?? 0;
            const calls = item.uniqueCallSessions ?? 0;
            const dirs = item.uniqueDirectionSessions ?? 0;
            const web = item.uniqueWebsiteSessions ?? 0;
            return [
                item.store?.storeName ?? "", item.store?.city ?? "", item.store?.region ?? "",
                views, item.uniqueSearchSessions ?? 0, calls, dirs, web,
                convRate(calls, views), convRate(dirs, views), convRate(web, views),
            ];
        }),
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 30, 30], lineColor: [229, 231, 235], lineWidth: 0.3 },
        headStyles: { fillColor: [79, 110, 247], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: {
            0: { cellWidth: 45 }, 1: { cellWidth: 28 }, 2: { cellWidth: 22 },
            3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" },
            6: { halign: "center" }, 7: { halign: "center" }, 8: { halign: "center" },
            9: { halign: "center" }, 10: { halign: "center" },
        },
        alternateRowStyles: { fillColor: [248, 249, 255] },
        foot: overallTotals ? [[
            "TOTAL", "", "",
            overallTotals.uniqueViewSessions, overallTotals.uniqueSearchSessions,
            overallTotals.uniqueCallSessions, overallTotals.uniqueDirectionSessions,
            overallTotals.uniqueWebsiteSessions, "", "", "",
        ]] : undefined,
        footStyles: { fillColor: [243, 244, 246], fontStyle: "bold", textColor: [30, 30, 30], halign: "center" },
    });

    // ── Page numbers ──────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${i} of ${pageCount}`, pageW / 2, pageH - 3, { align: "center" });
    }

    doc.save(`analytics_report_${new Date().toISOString().split("T")[0]}.pdf`);
    return true;
}
