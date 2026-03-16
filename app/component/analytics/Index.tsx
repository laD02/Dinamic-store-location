import { useEffect, useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import Conversion from "./conversion";
import NotificationCenter from "../NotificationCenter";
import { exportAnalyticsToPDF } from "app/utils/exportAnalyticsPDF";
import { exportAnalyticsToCSV } from "app/utils/exportAnalyticsCSV";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
    AreaChart,
    Area,
} from "recharts";

const METRICS = [
    { key: "uniqueViewSessions", label: "Views", icon: "👁", color: "#4f6ef7" },
    { key: "uniqueSearchSessions", label: "Searches", icon: "🔍", color: "#f59e0b" },
    { key: "uniqueCallSessions", label: "Phone", icon: "📞", color: "#10b981" },
    { key: "uniqueDirectionSessions", label: "Directions", icon: "🗺", color: "#ef4444" },
    { key: "uniqueWebsiteSessions", label: "Website", icon: "🌐", color: "#8b5cf6" },
];

function ConversionChart({
    data,
    interval,
    visibleMetrics,
}: {
    data: any[];
    interval: string;
    visibleMetrics: Set<string>;
}) {
    const chartData = useMemo(() => {
        return data.map((d) => {
            const views = d.uniqueViewSessions || 0;

            return {
                date: d.date,
                uniqueCallSessions:
                    views > 0
                        ? Number(((d.uniqueCallSessions / views) * 100).toFixed(2))
                        : 0,
                uniqueDirectionSessions:
                    views > 0
                        ? Number(((d.uniqueDirectionSessions / views) * 100).toFixed(2))
                        : 0,
                uniqueWebsiteSessions:
                    views > 0
                        ? Number(((d.uniqueWebsiteSessions / views) * 100).toFixed(2))
                        : 0,
            };
        });
    }, [data]);

    const formatTooltip = (value: any) => `${value}%`;
    const formatYAxis = (value: any) => `${value}%`;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                    {METRICS.map(m => (
                        <linearGradient key={`grad-conv-${m.key}`} id={`grad-conv-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={m.color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                    minTickGap={30}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatYAxis}
                    dx={-10}
                />
                <Tooltip
                    formatter={formatTooltip}
                    contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                    }}
                />
                <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                />
                {METRICS.filter(m => visibleMetrics.has(m.key) && ["uniqueCallSessions", "uniqueDirectionSessions", "uniqueWebsiteSessions"].includes(m.key)).map(m => (
                    <Area
                        key={m.key}
                        type="monotone"
                        dataKey={m.key}
                        name={m.label + " Conversion"}
                        stroke={m.color}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill={`url(#grad-conv-${m.key})`}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}
export default function Index() {
    const { stats, level } = useLoaderData();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showSearch, setShowSearch] = useState(false);
    const [interval, setInterval] = useState<"0" | "1" | "2">("0"); // 0=Daily, 1=Weekly, 2=Monthly
    const [activityFilter, setActivityFilter] = useState<"0" | "1" | "2" | "3" | "4" | "5">("0");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"uniqueViewSessions" | "uniqueSearchSessions" | "uniqueCallSessions" | "uniqueDirectionSessions" | "uniqueWebsiteSessions" | null>(null);
    const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
        new Set(METRICS.map(m => m.key))
    );

    const toggleMetric = (key: string) => {
        setVisibleMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const [conversionInterval, setConversionInterval] = useState<"0" | "1" | "2">("0");
    const [conversionVisibleMetrics, setConversionVisibleMetrics] = useState<Set<string>>(
        new Set(["uniqueCallSessions", "uniqueDirectionSessions", "uniqueWebsiteSessions"])
    );

    const toggleConversionMetric = (key: string) => {
        setConversionVisibleMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const targetDates = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (interval === "0") {
            // Daily: Yesterday
            const start = new Date(today);
            start.setDate(today.getDate() - 1);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        } else if (interval === "1") {
            // Weekly: Last full Monday-Sunday week
            const dayOfWeek = today.getDay();
            const offsetToSun = dayOfWeek === 0 ? 7 : dayOfWeek;
            const end = new Date(today);
            end.setDate(today.getDate() - offsetToSun);
            end.setHours(23, 59, 59, 999);
            const start = new Date(end);
            start.setDate(end.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            return { start, end };
        } else {
            // Monthly: Last full calendar month
            const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
            const start = new Date(end.getFullYear(), end.getMonth(), 1, 0, 0, 0, 0);
            return { start, end };
        }
    }, [interval]);

    // Group stats by store (All-Time)
    const groupedStores = useMemo(() => {
        if (!stats || !Array.isArray(stats)) {
            return [];
        }


        const map: Record<string, any> = {};

        for (const stat of stats) {
            const key = stat.storeId ?? stat.shop;
            if (!map[key]) {
                map[key] = {
                    storeId: stat.storeId,
                    store: stat.store,
                    uniqueViewSessions: 0,
                    uniqueSearchSessions: 0,
                    uniqueCallSessions: 0,
                    uniqueDirectionSessions: 0,
                    uniqueWebsiteSessions: 0,
                };
            }
            map[key].uniqueViewSessions += (stat.uniqueViewSessions || 0);
            map[key].uniqueSearchSessions += (stat.uniqueSearchSessions || 0);
            map[key].uniqueCallSessions += (stat.uniqueCallSessions || 0);
            map[key].uniqueDirectionSessions += (stat.uniqueDirectionSessions || 0);
            map[key].uniqueWebsiteSessions += (stat.uniqueWebsiteSessions || 0);
        }
        const result = Object.values(map);
        return result;
    }, [stats]);

    const dailyTotals = useMemo(() => {
        const map: Record<string, { uniqueViewSessions: number; uniqueSearchSessions: number; uniqueCallSessions: number; uniqueDirectionSessions: number; uniqueWebsiteSessions: number }> = {};

        for (const stat of stats) {
            const dateObj = new Date(stat.date);
            let dateKey = "";

            if (interval === "0") {
                // Daily: key là "Jan 1"
                dateKey = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            } else if (interval === "1") {
                // Weekly: key là "W1 Jan" (tuần bắt đầu từ thứ 2)
                const monday = new Date(dateObj);
                monday.setDate(dateObj.getDate() - ((dateObj.getDay() + 6) % 7));
                dateKey = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            } else {
                // Monthly: key là "Jan 2024"
                dateKey = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            }

            if (!map[dateKey]) {
                map[dateKey] = {
                    uniqueViewSessions: 0,
                    uniqueSearchSessions: 0,
                    uniqueCallSessions: 0,
                    uniqueDirectionSessions: 0,
                    uniqueWebsiteSessions: 0,
                };
            }
            map[dateKey].uniqueViewSessions += stat.uniqueViewSessions;
            map[dateKey].uniqueSearchSessions += stat.uniqueSearchSessions;
            map[dateKey].uniqueCallSessions += stat.uniqueCallSessions;
            map[dateKey].uniqueDirectionSessions += stat.uniqueDirectionSessions;
            map[dateKey].uniqueWebsiteSessions += stat.uniqueWebsiteSessions;
        }

        const result = [];
        const today = new Date();

        if (interval === "0") {
            // 30 ngày gần nhất
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }) });
            }
        } else if (interval === "1") {
            // 12 tuần gần nhất (lấy thứ 2 của tuần hiện tại rồi trừ lui)
            const currentMonday = new Date(today);
            currentMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
            currentMonday.setHours(0, 0, 0, 0);

            for (let i = 11; i >= 0; i--) {
                const monday = new Date(currentMonday);
                monday.setDate(currentMonday.getDate() - i * 7);
                const dateKey = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }) });
            }
        } else {
            // 12 tháng gần nhất
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const dateKey = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }) });
            }
        }

        return result;
    }, [stats, interval]);

    const conversionDailyTotals = useMemo(() => {
        const map: Record<string, { uniqueViewSessions: number; uniqueCallSessions: number; uniqueDirectionSessions: number; uniqueWebsiteSessions: number }> = {};

        for (const stat of stats) {
            const dateObj = new Date(stat.date);
            let dateKey = "";

            if (conversionInterval === "0") {
                dateKey = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            } else if (conversionInterval === "1") {
                const monday = new Date(dateObj);
                monday.setDate(dateObj.getDate() - ((dateObj.getDay() + 6) % 7));
                dateKey = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            } else {
                dateKey = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            }

            if (!map[dateKey]) {
                map[dateKey] = { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 };
            }
            map[dateKey].uniqueViewSessions += stat.uniqueViewSessions;
            map[dateKey].uniqueCallSessions += stat.uniqueCallSessions;
            map[dateKey].uniqueDirectionSessions += stat.uniqueDirectionSessions;
            map[dateKey].uniqueWebsiteSessions += stat.uniqueWebsiteSessions;
        }

        const result = [];
        const today = new Date();

        if (conversionInterval === "0") {
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }) });
            }
        } else if (conversionInterval === "1") {
            const currentMonday = new Date(today);
            currentMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
            currentMonday.setHours(0, 0, 0, 0);

            for (let i = 11; i >= 0; i--) {
                const monday = new Date(currentMonday);
                monday.setDate(currentMonday.getDate() - i * 7);
                const dateKey = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }) });
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const dateKey = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }) });
            }
        }

        return result;
    }, [stats, conversionInterval]);

    const filteredStores = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = term
            ? groupedStores.filter((item: any) => {
                const store = item.store;
                if (!store) return false;
                return (
                    store.storeName?.toLowerCase().includes(term) ||
                    store.city?.toLowerCase().includes(term) ||
                    store.address?.toLowerCase().includes(term)
                );
            })
            : [...groupedStores];

        if (sortBy) {
            result = [...result].sort((a, b) => b[sortBy] - a[sortBy]);
        }

        return result;
    }, [groupedStores, searchTerm, sortBy]);

    const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredStores.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [filteredStores.length, currentPage, totalPages]);

    const top5Stores = useMemo(() => {
        const ACTIVITY_MAP: Record<string, string> = {
            "1": "uniqueViewSessions",
            "2": "uniqueSearchSessions",
            "3": "uniqueCallSessions",
            "4": "uniqueDirectionSessions",
            "5": "uniqueWebsiteSessions",
        };

        return [...groupedStores]
            .map((s: any) => ({
                name: s.store?.storeName?.slice(0, 16) ?? "Unknown",
                Views: s.uniqueViewSessions,
                Searches: s.uniqueSearchSessions,
                Phone: s.uniqueCallSessions,
                Directions: s.uniqueDirectionSessions,
                Website: s.uniqueWebsiteSessions,
                _total: activityFilter === "0"
                    ? s.uniqueViewSessions + s.uniqueSearchSessions + s.uniqueCallSessions + s.uniqueDirectionSessions + s.uniqueWebsiteSessions
                    : s[ACTIVITY_MAP[activityFilter]],
            }))
            .sort((a, b) => b._total - a._total)
            .slice(0, 5);
    }, [groupedStores, activityFilter]);

    // Overall totals (All-Time) - Use all stats instead of filtered groupedStores
    const overallTotals = useMemo(
        () =>
            stats.reduce(
                (acc: any, s: any) => ({
                    uniqueViewSessions: acc.uniqueViewSessions + s.uniqueViewSessions,
                    uniqueSearchSessions: acc.uniqueSearchSessions + s.uniqueSearchSessions,
                    uniqueCallSessions: acc.uniqueCallSessions + s.uniqueCallSessions,
                    uniqueDirectionSessions: acc.uniqueDirectionSessions + s.uniqueDirectionSessions,
                    uniqueWebsiteSessions: acc.uniqueWebsiteSessions + s.uniqueWebsiteSessions,
                }),
                {
                    uniqueViewSessions: 0,
                    uniqueSearchSessions: 0,
                    uniqueCallSessions: 0,
                    uniqueDirectionSessions: 0,
                    uniqueWebsiteSessions: 0,
                }
            ),
        [stats]
    );

    const sortOptions = [
        { value: "uniqueViewSessions", label: "View" },
        { value: "uniqueSearchSessions", label: "Search" },
        { value: "uniqueCallSessions", label: "Phone" },
        { value: "uniqueDirectionSessions", label: "Direction" },
        { value: "uniqueWebsiteSessions", label: "Website" },
    ];

    const activityLabel = {
        "0": "All Activity",
        "1": "Views",
        "2": "Searches",
        "3": "Phone",
        "4": "Directions",
        "5": "Website",
    }[activityFilter];

    const handleChangeDate = (e: any) => {
        setInterval(e.target.values?.[0] ?? "0");
    };

    const handleChangeActivity = (e: any) => {
        setActivityFilter(e.target.values?.[0] ?? "0");
    };

    const chartHeading = interval === "0" ? "Daily Trend — Last 30 Days"
        : interval === "1" ? "Weekly Trend — Last 12 Weeks"
            : "Monthly Trend — Last 12 Months";

    const conversionChartHeading = conversionInterval === "0" ? "Conversion Trend — Last 30 Days"
        : conversionInterval === "1" ? "Conversion Trend — Last 12 Weeks"
            : "Conversion Trend — Last 12 Months";


    return (
        <s-stack inlineSize="100%">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" alignItems="center" gap="small-400">
                    <s-icon type="chart-vertical"></s-icon>
                    <h2>Analytics</h2>
                </s-stack>
                <s-stack direction="inline" gap="small-400" alignItems="center">
                    <s-button commandFor="export-menu" icon="export">Export</s-button>
                    {level === 'plus' && <NotificationCenter />}
                </s-stack>
            </s-stack>

            <s-menu id="export-menu" accessibilityLabel="Customer actions">
                <s-button onClick={() => {
                    const ok = exportAnalyticsToPDF(filteredStores, {
                        overallTotals,
                        chartHeadings: {
                            trend: chartHeading,
                            conversion: conversionChartHeading,
                            topStores: `Top Stores by ${activityLabel}`,
                        },
                        dailyTotals,
                        conversionTotals: conversionDailyTotals,
                        top5Stores,
                    });
                    if (!ok) alert("No data to export.");
                }}>PDF</s-button>
                <s-button onClick={() => {
                    const ok = exportAnalyticsToCSV(filteredStores, {
                        overallTotals,
                        dailyTotals,
                        conversionTotals: conversionDailyTotals,
                        top5Stores,
                    });
                    if (!ok) alert("No data to export.");
                }}>CSV</s-button>
            </s-menu>

            <s-stack gap="base">
                <s-banner tone="info" heading="Store Performance Analytics" dismissible>
                    This dashboard provides detailed information about your store's location performance, including store views, phone number clicks, directions requests, and store search activity.
                </s-banner>

                {/* Summary cards */}
                <s-grid gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr 1fr 1fr 1fr, 1fr 1fr' gap="base">
                    {METRICS.map(m => (
                        <s-section key={m.key}>
                            <s-stack gap="small-200">
                                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
                                        <s-text tone="neutral">{m.label}</s-text>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        backgroundColor: `${m.color}15`,
                                        fontSize: '16px'
                                    }}>
                                        {m.key === 'uniqueViewSessions' ? '👁' : m.key === 'uniqueSearchSessions' ? '🔍' : m.key === 'uniqueCallSessions' ? '📞' : m.key === 'uniqueDirectionSessions' ? '🗺' : '🌐'}
                                    </div>
                                </s-stack>
                                <h1 style={{
                                    marginBlock: 0,
                                    fontSize: '28px',
                                    fontWeight: '700',
                                    color: '#1a1a1a',
                                    letterSpacing: '-0.5px'
                                }}>
                                    {(overallTotals as any)[m.key] ?? 0}
                                </h1>
                            </s-stack>
                        </s-section>
                    ))}
                </s-grid>

                {/* Conversion Rate */}
                <Conversion
                    viewCount={overallTotals.uniqueViewSessions}
                    callCount={overallTotals.uniqueCallSessions}
                    directionCount={overallTotals.uniqueDirectionSessions}
                    websiteCount={overallTotals.uniqueWebsiteSessions}
                />

                <s-button icon="calendar" commandFor="date">Analytics Filters</s-button>
                <s-popover id="date">
                    <s-stack padding="small">
                        <s-choice-list label="Time Interval" name="date-interval" onChange={(e: any) => handleChangeDate(e)}>
                            <s-choice value="0" selected>Daily</s-choice>
                            <s-choice value="1">Weekly</s-choice>
                            <s-choice value="2">Monthly</s-choice>
                        </s-choice-list>
                    </s-stack>
                    <s-divider></s-divider>
                    <s-stack padding="small" gap="none">
                        Activities
                        {METRICS.map(m => (
                            <s-checkbox
                                key={m.key}
                                label={m.label}
                                checked={visibleMetrics.has(m.key)}
                                onChange={() => toggleMetric(m.key)}
                            />
                        ))}
                    </s-stack>
                </s-popover>

                {/* Charts row */}
                <s-grid gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr, 1fr' gap="base">

                    {/* Daily trend line chart */}
                    <s-section heading={chartHeading}>
                        {dailyTotals.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={dailyTotals} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <defs>
                                        {METRICS.map(m => (
                                            <linearGradient key={`grad-${m.key}`} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={m.color} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: "#6b7280" }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        minTickGap={20}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#6b7280" }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                                    />
                                    {METRICS.filter(m => visibleMetrics.has(m.key)).map(m => (
                                        <Area
                                            key={m.key}
                                            type="monotone"
                                            dataKey={m.key}
                                            name={m.label}
                                            stroke={m.color}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill={`url(#grad-${m.key})`}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    ))}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data</div>
                        )}
                    </s-section>

                    <s-button icon="calendar" commandFor="conversion-date">Conversion Filters</s-button>
                    <s-popover id="conversion-date">
                        <s-stack padding="small">
                            <s-choice-list label="Time Interval" name="conversion-interval" onChange={(e: any) => setConversionInterval(e.target.values?.[0] ?? "0")}>
                                <s-choice value="0" selected={conversionInterval === "0"}>Daily</s-choice>
                                <s-choice value="1" selected={conversionInterval === "1"}>Weekly</s-choice>
                                <s-choice value="2" selected={conversionInterval === "2"}>Monthly</s-choice>
                            </s-choice-list>
                        </s-stack>
                        <s-divider></s-divider>
                        <s-stack padding="small" gap="none">
                            Metrics
                            {METRICS.filter(m => ["uniqueCallSessions", "uniqueDirectionSessions", "uniqueWebsiteSessions"].includes(m.key)).map(m => (
                                <s-checkbox
                                    key={m.key}
                                    label={m.label}
                                    checked={conversionVisibleMetrics.has(m.key)}
                                    onChange={() => toggleConversionMetric(m.key)}
                                />
                            ))}
                        </s-stack>
                    </s-popover>

                    <s-section heading={conversionChartHeading}>
                        {conversionDailyTotals.length > 0 ? (
                            <ConversionChart
                                data={conversionDailyTotals}
                                interval={conversionInterval}
                                visibleMetrics={conversionVisibleMetrics}
                            />
                        ) : (
                            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data</div>
                        )}
                    </s-section>

                    <s-button icon="calendar" commandFor="activity">Top Activity</s-button>
                    <s-popover id="activity">
                        <s-stack padding="small">
                            <s-choice-list name="activity-interval" onChange={(e: any) => handleChangeActivity(e)}>
                                <s-choice value="0" selected>All activity</s-choice>
                                <s-choice value="1">Views</s-choice>
                                <s-choice value="2">Searches</s-choice>
                                <s-choice value="3">Phone</s-choice>
                                <s-choice value="4">Directions</s-choice>
                                <s-choice value="5">Website</s-choice>
                            </s-choice-list>
                        </s-stack>
                    </s-popover>

                    <s-section heading={`Top Stores by ${activityLabel}`}>
                        {top5Stores.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={top5Stores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: "#6b7280" }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={5}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#6b7280" }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid #e5e7eb',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 / 0.1)',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}
                                    />
                                    {activityFilter === "0" || activityFilter === "1" ? <Bar dataKey="Views" fill="#4f6ef7" radius={[6, 6, 0, 0]} barSize={24} /> : null}
                                    {activityFilter === "0" || activityFilter === "2" ? <Bar dataKey="Searches" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} /> : null}
                                    {activityFilter === "0" || activityFilter === "3" ? <Bar dataKey="Phone" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} /> : null}
                                    {activityFilter === "0" || activityFilter === "4" ? <Bar dataKey="Directions" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} /> : null}
                                    {activityFilter === "0" || activityFilter === "5" ? <Bar dataKey="Website" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} /> : null}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data</div>
                        )}
                    </s-section>

                </s-grid>

                {/* Table */}
                <s-section padding="none" accessibilityLabel="Puzzles table section">
                    <s-table>
                        <s-grid slot="filters" gap="small-200" gridTemplateColumns="1fr auto">
                            <div style={{ flex: 1 }}>
                                <s-stack direction="inline" gap="small-200" justifyContent={showSearch ? "space-between" : 'end'}>
                                    {showSearch ? (
                                        <div style={{ flex: 1, gap: 8, display: "flex", height: 28 }}>
                                            <s-search-field
                                                placeholder="Search by name, city, or address"
                                                value={searchTerm}
                                                onInput={(event) => { const target = event.target as any; setSearchTerm(target.value); }}
                                            />
                                            <s-button variant="tertiary" onClick={() => { setShowSearch(false); setSearchTerm(""); }}>Cancel</s-button>
                                        </div>
                                    ) : (
                                        <s-button icon="search" onClick={() => setShowSearch(true)}></s-button>
                                    )}
                                    <s-button
                                        icon="sort"
                                        variant={sortBy ? "primary" : "secondary"}
                                        accessibilityLabel="Sort"
                                        interestFor="sort-tooltip"
                                        commandFor="sort-actions"
                                    />
                                    <s-tooltip id="sort-tooltip"><s-text>Sort</s-text></s-tooltip>
                                    <s-popover id="sort-actions">
                                        <s-stack gap="none">
                                            <s-box padding="small">
                                                <s-stack direction="inline" alignItems="center" gap="small-400">Order by</s-stack>
                                                <s-choice-list
                                                    name="sortBy"
                                                    values={sortBy ? [sortBy] : []}
                                                    onChange={(e: any) => setSortBy(e.target.values?.[0] || null)}
                                                >
                                                    {sortOptions.map(opt => (
                                                        <s-choice key={opt.value} value={opt.value}>
                                                            {opt.label}{sortBy === opt.value ? " ↓" : ""}
                                                        </s-choice>
                                                    ))}
                                                </s-choice-list>
                                                <s-button variant="tertiary" onClick={() => setSortBy(null)}>Clear</s-button>
                                            </s-box>
                                        </s-stack>
                                    </s-popover>
                                </s-stack>
                            </div>
                        </s-grid>
                        {
                            filteredStores.length !== 0 ? (
                                <>
                                    <s-table-header-row>
                                        <s-table-header listSlot="primary">Store Name</s-table-header>
                                        {sortOptions.map(opt => (
                                            <s-table-header key={opt.value} listSlot="secondary">
                                                {opt.label}{sortBy === opt.value ? " ↓" : ""}
                                            </s-table-header>
                                        ))}
                                    </s-table-header-row>

                                    <s-table-body>
                                        {currentItems.map((item: any) => (
                                            <s-table-row key={item.storeId ?? item.store?.id}>
                                                <s-table-cell>
                                                    <s-stack direction="inline" alignItems="center" gap="base">
                                                        <s-thumbnail src={item.store?.image || ''} size="small" />
                                                        <s-stack gap="none">
                                                            <s-link href={`/app/analytic-detail/${item.store?.id}`}>
                                                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#1a1a1a' }}>{item.store?.storeName}</span>
                                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                    <s-text tone="neutral">{item.store?.address}, {item.store?.city}, {item.store?.region}{item.store?.code ? `, ${item.store?.code}` : ''}</s-text>
                                                                </div>
                                                            </s-link>
                                                        </s-stack>
                                                    </s-stack>
                                                </s-table-cell>
                                                <s-table-cell><span style={{ fontWeight: '600' }}>{item.uniqueViewSessions}</span></s-table-cell>
                                                <s-table-cell><span style={{ fontWeight: '600' }}>{item.uniqueSearchSessions}</span></s-table-cell>
                                                <s-table-cell><span style={{ fontWeight: '600' }}>{item.uniqueCallSessions}</span></s-table-cell>
                                                <s-table-cell><span style={{ fontWeight: '600' }}>{item.uniqueDirectionSessions}</span></s-table-cell>
                                                <s-table-cell><span style={{ fontWeight: '600' }}>{item.uniqueWebsiteSessions}</span></s-table-cell>
                                            </s-table-row>
                                        ))}
                                    </s-table-body>
                                </>
                            ) : (
                                <s-table-body>
                                    <s-table-row>
                                        <s-table-cell>
                                            <s-stack alignItems="center" gap="small">
                                                <h2>No filters found</h2>
                                                <s-text color="subdued">Try changing the filters or search term</s-text>
                                            </s-stack>
                                        </s-table-cell>
                                    </s-table-row>
                                </s-table-body>
                            )
                        }
                    </s-table>
                    <s-stack direction="inline" justifyContent="center" gap="small-400" background="subdued" paddingBlock="small-200">
                        <s-button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} icon="caret-left"></s-button>
                        <s-button variant="secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} icon="caret-right"></s-button>
                    </s-stack>
                </s-section>
            </s-stack>
        </s-stack>
    );
}