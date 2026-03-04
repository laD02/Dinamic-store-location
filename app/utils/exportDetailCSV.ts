// app/utils/exportDetailCSV.ts

import type {
    DetailTrendRow,
    DetailConversionRow,
    DetailTotals,
    DetailStoreInfo,
} from "./exportDetailPDF";

export interface ExportDetailCSVOptions {
    store: DetailStoreInfo | null;
    totals: DetailTotals;
    dailyTrend: DetailTrendRow[];
    conversionTrend: DetailConversionRow[];
}

type Row = (string | number)[];

function escapeCell(v: string | number): string {
    return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function buildSection(title: string, headers: string[], rows: Row[]): string {
    const lines: string[] = [];
    lines.push(escapeCell(title));
    lines.push(headers.map(escapeCell).join(","));
    rows.forEach(row => lines.push(row.map(escapeCell).join(",")));
    lines.push(""); // blank separator
    return lines.join("\n");
}

const convRate = (n: number, views: number) =>
    views > 0 ? `${((n / views) * 100).toFixed(1)}%` : "—";

export function exportDetailToCSV(options: ExportDetailCSVOptions): boolean {
    const { store, totals, dailyTrend, conversionTrend } = options;
    const sections: string[] = [];

    // ── Store Info ─────────────────────────────────────────────────
    sections.push(buildSection(
        "Store Information",
        ["Field", "Value"],
        [
            ["Store Name", store?.storeName ?? ""],
            ["Address", store?.address ?? ""],
            ["City", store?.city ?? ""],
            ["State/Region", store?.region ?? ""],
            ["Code", store?.code ?? ""],
        ]
    ));

    // ── Overall Summary ────────────────────────────────────────────
    const views = totals.uniqueViewSessions;
    sections.push(buildSection(
        "Overall Summary",
        ["Metric", "Total", "Conversion Rate"],
        [
            ["Views", totals.uniqueViewSessions],
            ["Searches", totals.uniqueSearchSessions],
            ["Phone Clicks", totals.uniqueCallSessions, convRate(totals.uniqueCallSessions, views)],
            ["Directions", totals.uniqueDirectionSessions, convRate(totals.uniqueDirectionSessions, views)],
            ["Website Clicks", totals.uniqueWebsiteSessions, convRate(totals.uniqueWebsiteSessions, views)],
        ]
    ));

    // ── Activity Trend ─────────────────────────────────────────────
    if (dailyTrend && dailyTrend.length > 0) {
        sections.push(buildSection(
            "Activity Trend",
            ["Date", "Views", "Searches", "Phone", "Directions", "Website"],
            dailyTrend.map(r => [
                r.date,
                r.uniqueViewSessions,
                r.uniqueSearchSessions,
                r.uniqueCallSessions,
                r.uniqueDirectionSessions,
                r.uniqueWebsiteSessions,
            ])
        ));
    }

    // ── Conversion Trend ───────────────────────────────────────────
    if (conversionTrend && conversionTrend.length > 0) {
        sections.push(buildSection(
            "Conversion Trend",
            ["Date", "Views", "Phone", "Phone Conv.", "Directions", "Dir. Conv.", "Website", "Web Conv."],
            conversionTrend.map(r => [
                r.date,
                r.uniqueViewSessions,
                r.uniqueCallSessions,
                convRate(r.uniqueCallSessions, r.uniqueViewSessions),
                r.uniqueDirectionSessions,
                convRate(r.uniqueDirectionSessions, r.uniqueViewSessions),
                r.uniqueWebsiteSessions,
                convRate(r.uniqueWebsiteSessions, r.uniqueViewSessions),
            ])
        ));
    }

    const bom = "\uFEFF";
    const content = bom + sections.join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const slug = (store?.storeName ?? "store").toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    link.download = `analytics_${slug}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
}
