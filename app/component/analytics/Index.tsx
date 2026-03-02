import { useEffect, useMemo, useState } from "react";
import { useLoaderData } from "react-router";

export default function Index() {
    const { stats } = useLoaderData();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"viewCount" | "searchCount" | "callCount" | "directionCount" | null>(null);

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
                };
            }
            map[key].viewCount += stat.viewCount;
            map[key].searchCount += stat.searchCount;
            map[key].callCount += stat.callCount;
            map[key].directionCount += stat.directionCount;
        }
        return Object.values(map);
    }, [stats]);

    const filteredStores = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        let result = term
            ? groupedStores.filter((item: any) => {
                const store = item.store;
                if (!store) return false;
                return (
                    store.storeName?.toLowerCase().includes(term) ||
                    store.city?.toLowerCase().includes(term) ||
                    store.address?.toLowerCase().includes(term) ||
                    store.state?.toLowerCase().includes(term) ||
                    store.code?.toLowerCase().includes(term) ||
                    store.phone?.toLowerCase().includes(term)
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

    const sortOptions = [
        { value: "viewCount", label: "View" },
        { value: "searchCount", label: "Search" },
        { value: "callCount", label: "Phone" },
        { value: "directionCount", label: "Direction" },
    ];

    return (
        <s-stack inlineSize="100%">
            <h2>Analytics</h2>
            <s-stack gap="base">
                <s-banner tone="info" heading="Store Performance Analytics" dismissible>This dashboard provides detailed information about your store's location performance, including store views, phone number clicks, directions requests, and store search activity. Use these metrics to better understand customer engagement and optimize your store's display strategy.</s-banner>
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
                                    <s-tooltip id="sort-tooltip">
                                        <s-text>Sort</s-text>
                                    </s-tooltip>
                                    <s-popover id="sort-actions">
                                        <s-stack gap="none">
                                            <s-box padding="small">
                                                <s-stack direction="inline" alignItems="center" gap="small-400">
                                                    Order by
                                                    {/* <s-icon type="arrow-down"></s-icon> */}
                                                </s-stack>
                                                <s-choice-list
                                                    name="sortBy"
                                                    values={sortBy ? [sortBy] : []}
                                                    onChange={(e: any) => setSortBy(e.target.values?.[0] || null)}
                                                >
                                                    {sortOptions.map(opt => (
                                                        <s-choice key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                            {sortBy === opt.value ? " ↓" : ""}
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