import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router";
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
} from "recharts";

const METRICS = [
    { key: "viewCount", label: "Views", color: "#4f6ef7" },
    { key: "searchCount", label: "Searches", color: "#f59e0b" },
    { key: "callCount", label: "Phone", color: "#10b981" },
    { key: "directionCount", label: "Directions", color: "#ef4444" },
    { key: "websiteCount", label: "Website", color: "#8b5cf6" },
];

export default function Index() {
    const { stats } = useLoaderData();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showSearch, setShowSearch] = useState(false);
    const [interval, setInterval] = useState<"0" | "1" | "2">("0"); // 0=Daily, 1=Weekly, 2=Monthly
    const [activityFilter, setActivityFilter] = useState<"0" | "1" | "2" | "3" | "4" | "5">("0");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"viewCount" | "searchCount" | "callCount" | "directionCount" | "websiteCount" | null>(null);

    // Group stats by store (tổng hợp tất cả ngày)
    const groupedStores = useMemo(() => {
        const map: Record<string, any> = {};
        for (const stat of stats) {
            const key = stat.storeId ?? stat.shop;
            if (!map[key]) {
                map[key] = {
                    storeId: stat.storeId,
                    store: stat.store,
                    viewCount: 0,
                    searchCount: 0,
                    callCount: 0,
                    directionCount: 0,
                    websiteCount: 0,
                };
            }
            map[key].viewCount += stat.viewCount;
            map[key].searchCount += stat.searchCount;
            map[key].callCount += stat.callCount;
            map[key].directionCount += stat.directionCount;
            map[key].websiteCount += stat.websiteCount;
        }
        return Object.values(map);
    }, [stats]);

    const dailyTotals = useMemo(() => {
        const map: Record<string, { viewCount: number; searchCount: number; callCount: number; directionCount: number; websiteCount: number }> = {};

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
                map[dateKey] = { viewCount: 0, searchCount: 0, callCount: 0, directionCount: 0, websiteCount: 0 };
            }
            map[dateKey].viewCount += stat.viewCount;
            map[dateKey].searchCount += stat.searchCount;
            map[dateKey].callCount += stat.callCount;
            map[dateKey].directionCount += stat.directionCount;
            map[dateKey].websiteCount += stat.websiteCount;
        }

        const result = [];
        const today = new Date();

        if (interval === "0") {
            // 30 ngày gần nhất
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { viewCount: 0, searchCount: 0, callCount: 0, directionCount: 0, websiteCount: 0 }) });
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
                result.push({ date: dateKey, ...(map[dateKey] ?? { viewCount: 0, searchCount: 0, callCount: 0, directionCount: 0, websiteCount: 0 }) });
            }
        } else {
            // 12 tháng gần nhất
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const dateKey = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                result.push({ date: dateKey, ...(map[dateKey] ?? { viewCount: 0, searchCount: 0, callCount: 0, directionCount: 0, websiteCount: 0 }) });
            }
        }

        return result;
    }, [stats, interval]);

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
        const ACTIVITY_MAP: Record<string, keyof typeof groupedStores[0]> = {
            "1": "viewCount",
            "2": "searchCount",
            "3": "callCount",
            "4": "directionCount",
            "5": "websiteCount",
        };

        return [...groupedStores]
            .map((s: any) => ({
                name: s.store?.storeName?.slice(0, 16) ?? "Unknown",
                Views: s.viewCount,
                Searches: s.searchCount,
                Phone: s.callCount,
                Directions: s.directionCount,
                Website: s.websiteCount,
                _total: activityFilter === "0"
                    ? s.viewCount + s.searchCount + s.callCount + s.directionCount + s.websiteCount
                    : s[ACTIVITY_MAP[activityFilter]],
            }))
            .sort((a, b) => b._total - a._total)
            .slice(0, 5);
    }, [groupedStores, activityFilter]);

    // Overall totals
    const overallTotals = useMemo(() => groupedStores.reduce((acc: any, s: any) => ({
        viewCount: acc.viewCount + s.viewCount,
        searchCount: acc.searchCount + s.searchCount,
        callCount: acc.callCount + s.callCount,
        directionCount: acc.directionCount + s.directionCount,
        websiteCount: acc.websiteCount + s.websiteCount,
    }), { viewCount: 0, searchCount: 0, callCount: 0, directionCount: 0, websiteCount: 0 }), [groupedStores]);

    const sortOptions = [
        { value: "viewCount", label: "View" },
        { value: "searchCount", label: "Search" },
        { value: "callCount", label: "Phone" },
        { value: "directionCount", label: "Direction" },
        { value: "websiteCount", label: "Website" },
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


    return (
        <s-stack inlineSize="100%">
            <h2>Analytics</h2>
            <s-stack gap="base">
                <s-banner tone="info" heading="Store Performance Analytics" dismissible>
                    This dashboard provides detailed information about your store's location performance, including store views, phone number clicks, directions requests, and store search activity.
                </s-banner>

                {/* Summary cards */}
                <s-grid gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr 1fr 1fr, 1fr 1fr' gap="base">
                    {METRICS.map(m => (
                        <s-section key={m.key} heading={m.label}>
                            <h1 style={{ marginBlock: 0, color: m.color }}>
                                {(overallTotals as any)[m.key] ?? 0}
                            </h1>
                        </s-section>
                    ))}
                </s-grid>

                <s-button icon="calendar" commandFor="date">Time Interval</s-button>
                <s-popover id="date">
                    <s-stack padding="small">
                        <s-choice-list name="date-interval" onChange={(e: any) => handleChangeDate(e)}>
                            <s-choice value="0" selected>Daily</s-choice>
                            <s-choice value="1">Weekly</s-choice>
                            <s-choice value="2">Monthly</s-choice>
                        </s-choice-list>
                    </s-stack>
                </s-popover>

                {/* Charts row */}
                <s-grid gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr, 1fr' gap="base">

                    {/* Daily trend line chart */}
                    <s-section heading={chartHeading}>
                        {dailyTotals.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={dailyTotals} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {METRICS.map(m => (
                                        <Line key={m.key} type="monotone" dataKey={m.key} name={m.label} stroke={m.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data</div>
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
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={top5Stores} margin={{ top: 8, right: 16, left: -16, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    {activityFilter === "0" || activityFilter === "1" ? <Bar dataKey="Views" fill="#4f6ef7" radius={[4, 4, 0, 0]} /> : null}
                                    {activityFilter === "0" || activityFilter === "2" ? <Bar dataKey="Searches" fill="#f59e0b" radius={[4, 4, 0, 0]} /> : null}
                                    {activityFilter === "0" || activityFilter === "3" ? <Bar dataKey="Phone" fill="#10b981" radius={[4, 4, 0, 0]} /> : null}
                                    {activityFilter === "0" || activityFilter === "4" ? <Bar dataKey="Directions" fill="#ef4444" radius={[4, 4, 0, 0]} /> : null}
                                    {activityFilter === "0" || activityFilter === "5" ? <Bar dataKey="Website" fill="#8b5cf6" radius={[4, 4, 0, 0]} /> : null}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>No data</div>
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
                                                        <s-link href={`/app/analytic-detail/${item.store?.id}`}>
                                                            <s-box>{item.store?.storeName}</s-box>
                                                            <s-box>{item.store?.address}, {item.store?.city}, {item.store?.region}{item.store?.code ? `, ${item.store?.code}` : ''}</s-box>
                                                        </s-link>
                                                    </s-stack>
                                                </s-table-cell>
                                                <s-table-cell>{item.viewCount}</s-table-cell>
                                                <s-table-cell>{item.searchCount}</s-table-cell>
                                                <s-table-cell>{item.callCount}</s-table-cell>
                                                <s-table-cell>{item.directionCount}</s-table-cell>
                                                <s-table-cell>{item.websiteCount}</s-table-cell>
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