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

function MetricChart({
    data,
    metricKey,
    label,
    color,
}: {
    data: DailyStat[];
    metricKey: string;
    label: string;
    color: string;
}) {
    const chartData = data.map((stat) => ({
        date: formatDate(stat.date as unknown as string),
        value: (stat as any)[metricKey],
    }));

    if (data.length === 0) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 180,
                    color: "#9ca3af",
                    fontSize: 14,
                }}
            >
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                    }}
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

                {/* Charts */}
                <s-grid
                    gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr, 1fr'
                    gap="base"
                >
                    {METRIC_CONFIG.map((m) => (
                        <s-section key={m.key} heading={`${m.heading} — Daily Trend`}>
                            <MetricChart
                                data={store.dailyStats}
                                metricKey={m.key}
                                label={m.label}
                                color={m.color}
                            />
                        </s-section>
                    ))}
                </s-grid>

            </s-stack>
        </s-query-container>
    );
}