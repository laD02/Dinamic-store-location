import { useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import {
    LineChart,
    Line,
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
        key: "viewCount",
        label: "Views",
        color: "#4f6ef7",
        icon: "👁",
        heading: "View",
    },
    {
        key: "searchCount",
        label: "Searches",
        color: "#f59e0b",
        icon: "🔍",
        heading: "Search",
    },
    {
        key: "callCount",
        label: "Phone Clicks",
        color: "#10b981",
        icon: "📞",
        heading: "Phone",
    },
    {
        key: "directionCount",
        label: "Directions",
        color: "#ef4444",
        icon: "🗺",
        heading: "Direction",
    },
    {
        key: "websiteCount",
        label: "Website Clicks",
        color: "#8b5cf6",
        icon: "🌐",
        heading: "Website",
    },
];

interface DailyStat {
    date: string;
    viewCount: number;
    searchCount: number;
    callCount: number;
    directionCount: number;
    websiteCount: number;
}

interface StoreData {
    store: {
        storeName: string;
        image?: string;
        address?: string;
        city?: string;
        state?: string;
    } | null;
    dailyStats: DailyStat[];
    viewCount: number;
    searchCount: number;
    callCount: number;
    directionCount: number;
    websiteCount: number;
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

function MetricChart({
    data,
    metricKey,
    label,
    color,
    interval,
}: {
    data: DailyStat[];
    metricKey: string;
    label: string;
    color: string;
    interval: Interval;
}) {
    const chartData = useMemo(() => {
        const map: Record<string, number> = {};
        for (const stat of data) {
            const dateKey = getDateKey(new Date(stat.date), interval);
            map[dateKey] = (map[dateKey] ?? 0) + (stat as any)[metricKey];
        }
        return getPeriodKeys(interval).map((dateKey) => ({
            date: dateKey,
            value: map[dateKey] ?? 0,
        }));
    }, [data, metricKey, interval]);

    return (
        <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(val: any) => [val, label]}
                />
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: color }}
                    activeDot={{ r: 5 }}
                    name={label}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default function Index() {
    const { store } = useLoaderData() as { store: StoreData };
    const navigate = useNavigate();
    const [interval, setInterval] = useState<Interval>("0");
    const intervalLabel = interval === "0" ? "Last 30 Days" : interval === "1" ? "Last 12 Weeks" : "Last 12 Months";

    const totals: Record<string, number> = {
        viewCount: store.viewCount,
        searchCount: store.searchCount,
        callCount: store.callCount,
        directionCount: store.directionCount,
        websiteCount: store.websiteCount,
    };

    return (
        <s-query-container>
            <s-stack inlineSize="100%" gap="base">

                {/* Header */}
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

                {/* Summary cards */}
                <s-grid
                    gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr 1fr 1fr 1fr, 1fr 1fr'
                    gap="base"
                >
                    {METRIC_CONFIG.map((m) => (
                        <s-section key={m.key} heading={m.heading}>
                            <s-stack direction="inline" alignItems="center" gap="small-200">
                                <span style={{ fontSize: 22 }}>{m.icon}</span>
                                <h1 style={{ marginBlock: 0, color: m.color }}>
                                    {totals[m.key] ?? 0}
                                </h1>
                            </s-stack>
                        </s-section>
                    ))}
                </s-grid>

                <s-button icon="calendar" commandFor="date">Time Interval</s-button>
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
                </s-popover>

                {/* Charts */}
                <s-grid gap="base">
                    {METRIC_CONFIG.map((m) => (
                        <s-section key={m.key} heading={`${m.heading} — ${intervalLabel}`}>
                            <MetricChart
                                data={store.dailyStats}
                                metricKey={m.key}
                                label={m.label}
                                color={m.color}
                                interval={interval}
                            />
                        </s-section>
                    ))}
                </s-grid>

            </s-stack>
        </s-query-container>
    );
}