// app/utils/exportAnalyticsCSV.ts

import type {
    AnalyticsStoreRow,
    TrendRow,
    ConversionRow,
    TopStoreRow,
} from "./exportAnalyticsPDF";

type OverallTotals = {
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
};

interface ExportCSVOptions {
    overallTotals?: OverallTotals;
    dailyTotals?: TrendRow[];
    conversionTotals?: ConversionRow[];
    top5Stores?: TopStoreRow[];
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

/**
 * Export analytics data to a multi-section CSV file.
 * Sections: Summary | Trend | Conversion | Top Stores | Store Detail
 */
export function exportAnalyticsToCSV(
    stores: AnalyticsStoreRow[],
    options: ExportCSVOptions = {}
): boolean {
    if (!stores || stores.length === 0) return false;

    const { overallTotals, dailyTotals, conversionTotals, top5Stores } = options;
    const sections: string[] = [];

    // ── Overall Summary ────────────────────────────────────────────
    if (overallTotals) {
        sections.push(buildSection(
            "Overall Summary",
            ["Metric", "Total", "Conversion Rate"],
            [
                ["Views", overallTotals.uniqueViewSessions],
                ["Searches", overallTotals.uniqueSearchSessions],
                ["Phone Clicks", overallTotals.uniqueCallSessions, convRate(overallTotals.uniqueCallSessions, overallTotals.uniqueViewSessions)],
                ["Directions", overallTotals.uniqueDirectionSessions, convRate(overallTotals.uniqueDirectionSessions, overallTotals.uniqueViewSessions)],
                ["Website Clicks", overallTotals.uniqueWebsiteSessions, convRate(overallTotals.uniqueWebsiteSessions, overallTotals.uniqueViewSessions)],
            ]
        ));
    }

    // ── Activity Trend ─────────────────────────────────────────────
    if (dailyTotals && dailyTotals.length > 0) {
        sections.push(buildSection(
            "Activity Trend",
            ["Date", "Views", "Searches", "Phone", "Directions", "Website"],
            dailyTotals.map(r => [
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
    if (conversionTotals && conversionTotals.length > 0) {
        sections.push(buildSection(
            "Conversion Trend",
            ["Date", "Views", "Phone", "Phone Conv.", "Directions", "Dir. Conv.", "Website", "Web Conv."],
            conversionTotals.map(r => [
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

    // ── Top Stores ─────────────────────────────────────────────────
    if (top5Stores && top5Stores.length > 0) {
        sections.push(buildSection(
            "Top Stores",
            ["Store Name", "Views", "Searches", "Phone", "Directions", "Website", "Total"],
            top5Stores.map(s => [
                s.name, s.Views, s.Searches, s.Phone, s.Directions, s.Website,
                s.Views + s.Searches + s.Phone + s.Directions + s.Website,
            ])
        ));
    }

    // ── Store Analytics Detail ────────────────────────────────────
    const detailRows: Row[] = stores.map(item => {
        const views = item.uniqueViewSessions ?? 0;
        const calls = item.uniqueCallSessions ?? 0;
        const dirs = item.uniqueDirectionSessions ?? 0;
        const web = item.uniqueWebsiteSessions ?? 0;
        return [
            item.store?.storeName ?? "",
            item.store?.city ?? "",
            item.store?.region ?? "",
            views,
            item.uniqueSearchSessions ?? 0,
            calls, dirs, web,
            convRate(calls, views),
            convRate(dirs, views),
            convRate(web, views),
        ];
    });
    if (overallTotals) {
        detailRows.push([
            "TOTAL", "", "",
            overallTotals.uniqueViewSessions,
            overallTotals.uniqueSearchSessions,
            overallTotals.uniqueCallSessions,
            overallTotals.uniqueDirectionSessions,
            overallTotals.uniqueWebsiteSessions,
            "", "", "",
        ]);
    }
    sections.push(buildSection(
        "Store Analytics Detail",
        ["Store Name", "City", "Country", "Views", "Searches", "Phone", "Directions", "Website", "Phone Conv.", "Dir. Conv.", "Web Conv."],
        detailRows
    ));

    const bom = "\uFEFF";
    const content = bom + sections.join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
}
