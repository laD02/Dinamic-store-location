import { useMemo, useState, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { exportDetailToPDF } from "app/utils/exportDetailPDF";
import { exportDetailToCSV } from "app/utils/exportDetailCSV";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

type Interval = "0" | "1" | "2";

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const METRIC_CONFIG = [
    {
        key: "uniqueViewSessions",
        label: "Views",
        color: "#4f6ef7",
        icon: "👁",
        heading: "View",
    },
    {
        key: "uniqueSearchSessions",
        label: "Searches",
        color: "#f59e0b",
        icon: "🔍",
        heading: "Search",
    },
    {
        key: "uniqueCallSessions",
        label: "Phone Clicks",
        color: "#10b981",
        icon: "📞",
        heading: "Phone",
    },
    {
        key: "uniqueDirectionSessions",
        label: "Directions Clicks",
        color: "#ef4444",
        icon: "🗺",
        heading: "Direction",
    },
    {
        key: "uniqueWebsiteSessions",
        label: "Website Clicks",
        color: "#8b5cf6",
        icon: "🌐",
        heading: "Website",
    },
];

interface DailyStat {
    date: string;
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

interface StoreData {
    store: {
        storeName: string;
        image?: string;
        address?: string;
        city?: string;
        region?: string;
        code?: string;
    } | null;
    dailyStats: DailyStat[];
    uniqueViewSessions: number;
    uniqueSearchSessions: number;
    uniqueCallSessions: number;
    uniqueDirectionSessions: number;
    uniqueWebsiteSessions: number;
}

function getDateKey(dateObj: Date, interval: Interval): string {
    if (interval === "0") {
        return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (interval === "1") {
        const monday = new Date(dateObj);
        monday.setDate(dateObj.getDate() - ((dateObj.getDay() + 6) % 7));
        return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
        return dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
}

function getPeriodKeys(interval: Interval): string[] {
    const today = new Date();
    const result: string[] = [];

    if (interval === "0") {
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            result.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        }
    } else if (interval === "1") {
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        currentMonday.setHours(0, 0, 0, 0);
        for (let i = 11; i >= 0; i--) {
            const monday = new Date(currentMonday);
            monday.setDate(currentMonday.getDate() - i * 7);
            result.push(monday.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        }
    } else {
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            result.push(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
        }
    }

    return result;
}

function CombinedChart({
    data,
    interval,
    visibleMetrics,
}: {
    data: DailyStat[];
    interval: Interval;
    visibleMetrics: Set<string>;
}) {
    const chartData = useMemo(() => {
        const map: Record<string, { uniqueViewSessions: number; uniqueSearchSessions: number; uniqueCallSessions: number; uniqueDirectionSessions: number; uniqueWebsiteSessions: number }> = {};
        for (const stat of data) {
            const dateKey = getDateKey(new Date(stat.date), interval);
            if (!map[dateKey]) {
                map[dateKey] = { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 };
            }
            map[dateKey].uniqueViewSessions += stat.uniqueViewSessions;
            map[dateKey].uniqueSearchSessions += stat.uniqueSearchSessions;
            map[dateKey].uniqueCallSessions += stat.uniqueCallSessions;
            map[dateKey].uniqueDirectionSessions += stat.uniqueDirectionSessions;
            map[dateKey].uniqueWebsiteSessions += stat.uniqueWebsiteSessions;
        }
        return getPeriodKeys(interval).map((dateKey) => ({
            date: dateKey,
            ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }),
        }));
    }, [data, interval]);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    {METRIC_CONFIG.map(m => (
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
                />
                <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    dx={-10}
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
                {METRIC_CONFIG.filter(m => visibleMetrics.has(m.key)).map(m => (
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
    );
}

function ConversionChart({
    data,
    interval,
    visibleMetrics,
}: {
    data: DailyStat[];
    interval: Interval;
    visibleMetrics: Set<string>;
}) {
    const chartData = useMemo(() => {
        const map: Record<string, { uniqueViewSessions: number; uniqueCallSessions: number; uniqueDirectionSessions: number; uniqueWebsiteSessions: number }> = {};
        for (const stat of data) {
            const dateKey = getDateKey(new Date(stat.date), interval);
            if (!map[dateKey]) {
                map[dateKey] = { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 };
            }
            map[dateKey].uniqueViewSessions += stat.uniqueViewSessions;
            map[dateKey].uniqueCallSessions += stat.uniqueCallSessions;
            map[dateKey].uniqueDirectionSessions += stat.uniqueDirectionSessions;
            map[dateKey].uniqueWebsiteSessions += stat.uniqueWebsiteSessions;
        }
        return getPeriodKeys(interval).map((dateKey) => {
            const aggr = map[dateKey] ?? { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 };
            const views = aggr.uniqueViewSessions || 0;
            return {
                date: dateKey,
                uniqueCallSessions: views > 0 ? Number(((aggr.uniqueCallSessions / views) * 100).toFixed(2)) : 0,
                uniqueDirectionSessions: views > 0 ? Number(((aggr.uniqueDirectionSessions / views) * 100).toFixed(2)) : 0,
                uniqueWebsiteSessions: views > 0 ? Number(((aggr.uniqueWebsiteSessions / views) * 100).toFixed(2)) : 0,
            };
        });
    }, [data, interval]);

    const formatTooltip = (value: any) => `${value}%`;
    const formatYAxis = (value: any) => `${value}%`;

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    {METRIC_CONFIG.map(m => (
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
                {METRIC_CONFIG.filter(m => visibleMetrics.has(m.key) && ["uniqueCallSessions", "uniqueDirectionSessions", "uniqueWebsiteSessions"].includes(m.key)).map(m => (
                    <Area
                        key={m.key}
                        type="monotone"
                        dataKey={m.key}
                        name={m.heading + " Conversion"}
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
    const { store } = useLoaderData() as { store: StoreData };
    const navigate = useNavigate();
    const [interval, setInterval] = useState<Interval>("0");
    const intervalLabel = interval === "0" ? "Last 30 Days" : interval === "1" ? "Last 12 Weeks" : "Last 12 Months";
    const chartHeading = interval === "0" ? "Daily Trend — Last 30 Days"
        : interval === "1" ? "Weekly Trend — Last 12 Weeks"
            : "Monthly Trend — Last 12 Months";
    const [visibleMetrics, setVisibleMetrics] = useState<Set<string>>(
        new Set(METRIC_CONFIG.map(m => m.key))
    );
    const [conversionInterval, setConversionInterval] = useState<Interval>("0");
    const conversionChartHeading = conversionInterval === "0" ? "Conversion Trend — Last 30 Days"
        : conversionInterval === "1" ? "Conversion Trend — Last 12 Weeks"
            : "Conversion Trend — Last 12 Months";
    const [conversionVisibleMetrics, setConversionVisibleMetrics] = useState<Set<string>>(
        new Set(["uniqueCallSessions", "uniqueDirectionSessions", "uniqueWebsiteSessions"])
    );
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const toggleMetric = (key: string) => {
        setVisibleMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleConversionMetric = (key: string) => {
        setConversionVisibleMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const totals: Record<string, number> = {
        uniqueViewSessions: store.uniqueViewSessions,
        uniqueSearchSessions: store.uniqueSearchSessions,
        uniqueCallSessions: store.uniqueCallSessions,
        uniqueDirectionSessions: store.uniqueDirectionSessions,
        uniqueWebsiteSessions: store.uniqueWebsiteSessions,
    };

    // Compute aggregated trend data for current interval (used for export)
    const dailyTrend = useMemo(() => {
        const map: Record<string, { uniqueViewSessions: number; uniqueSearchSessions: number; uniqueCallSessions: number; uniqueDirectionSessions: number; uniqueWebsiteSessions: number }> = {};
        for (const stat of store.dailyStats) {
            const dateKey = getDateKey(new Date(stat.date), interval);
            if (!map[dateKey]) map[dateKey] = { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 };
            map[dateKey].uniqueViewSessions += stat.uniqueViewSessions;
            map[dateKey].uniqueSearchSessions += stat.uniqueSearchSessions;
            map[dateKey].uniqueCallSessions += stat.uniqueCallSessions;
            map[dateKey].uniqueDirectionSessions += stat.uniqueDirectionSessions;
            map[dateKey].uniqueWebsiteSessions += stat.uniqueWebsiteSessions;
        }
        return getPeriodKeys(interval).map(dateKey => ({
            date: dateKey,
            ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }),
        }));
    }, [store.dailyStats, interval]);

    const conversionTrend = useMemo(() => {
        const map: Record<string, { uniqueViewSessions: number; uniqueCallSessions: number; uniqueDirectionSessions: number; uniqueWebsiteSessions: number }> = {};
        for (const stat of store.dailyStats) {
            const dateKey = getDateKey(new Date(stat.date), conversionInterval);
            if (!map[dateKey]) map[dateKey] = { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 };
            map[dateKey].uniqueViewSessions += stat.uniqueViewSessions;
            map[dateKey].uniqueCallSessions += stat.uniqueCallSessions;
            map[dateKey].uniqueDirectionSessions += stat.uniqueDirectionSessions;
            map[dateKey].uniqueWebsiteSessions += stat.uniqueWebsiteSessions;
        }
        return getPeriodKeys(conversionInterval).map(dateKey => ({
            date: dateKey,
            ...(map[dateKey] ?? { uniqueViewSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 }),
        }));
    }, [store.dailyStats, conversionInterval]);

    return (
        <s-query-container>
            <s-stack inlineSize="100%" gap="base">

                {/* Header */}
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                    <s-stack direction="inline" alignItems="center" gap="small-400">
                        <s-button
                            variant="tertiary"
                            onClick={() => {
                                requestAnimationFrame(() => {
                                    navigate("/app/analytics");
                                });
                            }}
                            icon="arrow-left"
                        ></s-button>
                        <h2 style={{ margin: 0 }}>{store.store?.storeName ?? "Store"}</h2>
                    </s-stack>

                    <s-button commandFor="detail-export-menu" icon="export">Export</s-button>
                    <s-menu id="detail-export-menu" accessibilityLabel="Export options">
                        <s-button onClick={() => {
                            const ok = exportDetailToPDF({
                                store: store.store,
                                totals: {
                                    uniqueViewSessions: store.uniqueViewSessions,
                                    uniqueSearchSessions: store.uniqueSearchSessions,
                                    uniqueCallSessions: store.uniqueCallSessions,
                                    uniqueDirectionSessions: store.uniqueDirectionSessions,
                                    uniqueWebsiteSessions: store.uniqueWebsiteSessions,
                                },
                                chartHeadings: { trend: chartHeading, conversion: conversionChartHeading },
                                dailyTrend,
                                conversionTrend,
                            });
                            if (!ok) alert("No data to export.");
                        }}>PDF</s-button>
                        <s-button onClick={() => {
                            const ok = exportDetailToCSV({
                                store: store.store,
                                totals: {
                                    uniqueViewSessions: store.uniqueViewSessions,
                                    uniqueSearchSessions: store.uniqueSearchSessions,
                                    uniqueCallSessions: store.uniqueCallSessions,
                                    uniqueDirectionSessions: store.uniqueDirectionSessions,
                                    uniqueWebsiteSessions: store.uniqueWebsiteSessions,
                                },
                                dailyTrend,
                                conversionTrend,
                            });
                            if (!ok) alert("No data to export.");
                        }}>CSV</s-button>
                    </s-menu>
                </s-stack>

                {/* Summary cards */}
                <s-grid
                    gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr 1fr 1fr 1fr, 1fr 1fr'
                    gap="base"
                >
                    {METRIC_CONFIG.map((m, idx) => (
                        <div key={m.key} style={{
                            opacity: animate ? 1 : 0,
                            transform: animate ? 'translateY(0)' : 'translateY(20px)',
                            transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s`
                        }}>
                            <s-section>
                                <s-stack gap="small-200">
                                    <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                        <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
                                            <s-text tone="neutral">{m.heading}</s-text>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            backgroundColor: `${m.color}15`,
                                            fontSize: '18px'
                                        }}>
                                            {m.icon}
                                        </div>
                                    </s-stack>
                                    <h1 style={{
                                        marginBlock: 0,
                                        fontSize: '28px',
                                        fontWeight: '700',
                                        color: '#1a1a1a',
                                        letterSpacing: '-0.5px'
                                    }}>
                                        {totals[m.key] ?? 0}
                                    </h1>
                                </s-stack>
                            </s-section>
                        </div>
                    ))}
                </s-grid>

                {/* Conversion Rate */}
                {(() => {
                    const views = store.uniqueViewSessions || 0;
                    const conversionMetrics = [
                        { key: 'uniqueCallSessions', label: 'Phone', heading: 'Phone Conversion', icon: '📞', color: '#10b981', value: store.uniqueCallSessions },
                        { key: 'uniqueDirectionSessions', label: 'Directions', heading: 'Direction Conversion', icon: '🗺', color: '#ef4444', value: store.uniqueDirectionSessions },
                        { key: 'uniqueWebsiteSessions', label: 'Website', heading: 'Website Conversion', icon: '🌐', color: '#8b5cf6', value: store.uniqueWebsiteSessions },
                    ];

                    return (
                        <s-grid gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr 1fr, 1fr' gap="base">
                            {conversionMetrics.map(m => {
                                const rate = views > 0 ? Math.min((m.value / views) * 100, 100) : 0;
                                const rateStr = rate.toFixed(1);
                                const tier = rate >= 60 ? { label: 'Excellent', bg: '#dcfce7', text: '#16a34a' }
                                    : rate >= 40 ? { label: 'Good', bg: '#fef9c3', text: '#ca8a04' }
                                        : rate >= 20 ? { label: 'Average', bg: '#fff7ed', text: '#ea580c' }
                                            : { label: 'Low', bg: '#fef2f2', text: '#dc2626' };

                                const R = 44, CIRCUMFERENCE = 2 * Math.PI * R;
                                const targetProgress = (rate / 100) * CIRCUMFERENCE;
                                const progress = animate ? targetProgress : 0;

                                return (
                                    <div key={m.key} style={{
                                        opacity: animate ? 1 : 0,
                                        transform: animate ? 'translateY(0)' : 'translateY(20px)',
                                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s'
                                    }}>
                                        <s-section>
                                            <s-stack gap="small-400" alignItems="center">
                                                <div style={{ position: 'relative', width: 110, height: 110 }}>
                                                    <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                                                        <circle cx="55" cy="55" r={R} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                                                        <circle
                                                            cx="55" cy="55" r={R}
                                                            fill="none"
                                                            stroke={m.color}
                                                            strokeWidth="10"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
                                                            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s' }}
                                                        />
                                                    </svg>
                                                    <div style={{
                                                        position: 'absolute', inset: 0,
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', justifyContent: 'center',
                                                        gap: '2px',
                                                    }}>
                                                        <span style={{ fontSize: '20px' }}>{m.icon}</span>
                                                        <span style={{ fontSize: '18px', fontWeight: 700, color: m.color, lineHeight: 1 }}>{rateStr}%</span>
                                                    </div>
                                                </div>

                                                <s-stack gap="small-200" alignItems="center">
                                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{m.heading}</div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {m.value.toLocaleString()} {m.label} / {views.toLocaleString()} Views
                                                    </div>
                                                    <div style={{
                                                        display: 'inline-block',
                                                        padding: '3px 10px',
                                                        borderRadius: '99px',
                                                        background: tier.bg,
                                                        color: tier.text,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                    }}>
                                                        {tier.label}
                                                    </div>
                                                </s-stack>
                                            </s-stack>
                                        </s-section>
                                    </div>
                                );
                            })}
                        </s-grid>
                    );
                })()}

                <s-button icon="calendar" commandFor="date">Analytics Filters</s-button>
                <s-popover id="date">
                    <s-stack padding="small">
                        <s-choice-list
                            name="date-interval"
                            values={[interval]}
                            onChange={(e: any) => setInterval(e.target.values?.[0] ?? "0")}
                        >
                            <s-choice value="0">Daily</s-choice>
                            <s-choice value="1">Weekly</s-choice>
                            <s-choice value="2">Monthly</s-choice>
                        </s-choice-list>
                    </s-stack>
                    <s-divider></s-divider>
                    <s-stack padding="small" gap="none">
                        Activities
                        {METRIC_CONFIG.map(m => (
                            <s-checkbox
                                key={m.key}
                                label={m.label}
                                checked={visibleMetrics.has(m.key)}
                                onChange={() => toggleMetric(m.key)}
                            />
                        ))}
                    </s-stack>
                </s-popover>

                {/* Charts */}
                <div style={{
                    opacity: animate ? 1 : 0,
                    transform: animate ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s'
                }}>
                    <s-section heading={chartHeading}>
                        <CombinedChart
                            data={store.dailyStats}
                            interval={interval}
                            visibleMetrics={visibleMetrics}
                        />
                    </s-section>
                </div>

                <s-button icon="calendar" commandFor="conversion-date">Conversion Filters</s-button>
                <s-popover id="conversion-date">
                    <s-stack padding="small">
                        <s-choice-list
                            name="conversion-interval"
                            values={[conversionInterval]}
                            onChange={(e: any) => setConversionInterval(e.target.values?.[0] ?? "0")}
                        >
                            <s-choice value="0">Daily</s-choice>
                            <s-choice value="1">Weekly</s-choice>
                            <s-choice value="2">Monthly</s-choice>
                        </s-choice-list>
                    </s-stack>
                    <s-divider></s-divider>
                    <s-stack padding="small" gap="none">
                        Metrics
                        {METRIC_CONFIG.filter(m => ["uniqueCallSessions", "uniqueDirectionSessions", "uniqueWebsiteSessions"].includes(m.key)).map(m => (
                            <s-checkbox
                                key={m.key}
                                label={m.label}
                                checked={conversionVisibleMetrics.has(m.key)}
                                onChange={() => toggleConversionMetric(m.key)}
                            />
                        ))}
                    </s-stack>
                </s-popover>

                {/* Conversion Chart */}
                <div style={{
                    opacity: animate ? 1 : 0,
                    transform: animate ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s'
                }}>
                    <s-section heading={conversionChartHeading}>
                        <ConversionChart
                            data={store.dailyStats}
                            interval={conversionInterval}
                            visibleMetrics={conversionVisibleMetrics}
                        />
                    </s-section>
                </div>

            </s-stack>
        </s-query-container>
    );
}