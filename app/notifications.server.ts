import prisma from "./db.server";

export async function createNotification(shop: string, title: string, message: string, type: string = "info") {
    return await prisma.notification.create({
        data: {
            shop,
            title,
            message,
            type
        }
    });
}

export async function getNotifications(shop: string, limit: number = 10) {
    return await prisma.notification.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" },
        take: limit
    });
}

export async function getUnreadCount(shop: string) {
    return await prisma.notification.count({
        where: { shop, isRead: false }
    });
}

export async function markAsRead(id: string) {
    return await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });
}

export async function markAllAsRead(shop: string) {
    return await prisma.notification.updateMany({
        where: { shop, isRead: false },
        data: { isRead: true }
    });
}

export async function getDailyReportStats(shop: string, date: Date) {
    // Get shops connected via B2B
    const connections = await prisma.shopConnection.findMany({
        where: { targetShop: shop },
        select: { sourceShop: true }
    });
    const sourceShops = connections.map(c => c.sourceShop);
    const allShops = [shop, ...sourceShops];

    // Get start and end of the specified date (UTC)
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);

    // Get previous day for growth comparison
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    const prevEnd = new Date(prevStart);
    prevEnd.setUTCHours(23, 59, 59, 999);

    const [rows, prevRows, allStores] = await Promise.all([
        prisma.storeDailyStat.findMany({
            where: { shop: { in: allShops }, date: { gte: start, lte: end } },
            include: { store: { select: { storeName: true, city: true } } }
        }),
        prisma.storeDailyStat.findMany({
            where: { shop: { in: allShops }, date: { gte: prevStart, lte: prevEnd } },
            include: { store: { select: { storeName: true, city: true } } }
        }),
        prisma.store.findMany({
            where: { shop: { in: allShops } },
            select: { id: true, storeName: true, city: true }
        })
    ]);

    // Aggregate total activities for the shop
    const totals = rows.reduce(
        (acc, r) => ({
            views: acc.views + r.uniqueViewSessions,
            searches: acc.searches + r.uniqueSearchSessions,
            directions: acc.directions + r.uniqueDirectionSessions,
            calls: acc.calls + r.uniqueCallSessions,
            websites: acc.websites + r.uniqueWebsiteSessions,
        }),
        { views: 0, searches: 0, directions: 0, calls: 0, websites: 0 }
    );

    const conversions = totals.directions + totals.calls + totals.websites;

    // Top 3 stores based on total sessions (keeping old data for compatibility)
    const topStores = rows
        .map(r => ({
            storeId: r.storeId,
            storeName: r.store?.storeName ?? r.storeId ?? "Unknown",
            city: r.store?.city ?? "",
            total: r.uniqueSessions,
            views: r.uniqueViewSessions,
            searches: r.uniqueSearchSessions,
            directions: r.uniqueDirectionSessions,
            calls: r.uniqueCallSessions,
            websites: r.uniqueWebsiteSessions,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

    // Build a map: storeId -> prev day stats
    const prevMap: Record<string, { views: number; searches: number; directions: number; calls: number; websites: number }> = {};
    prevRows.forEach(r => {
        prevMap[r.storeId ?? "unknown"] = {
            views: r.uniqueViewSessions,
            searches: r.uniqueSearchSessions,
            directions: r.uniqueDirectionSessions,
            calls: r.uniqueCallSessions,
            websites: r.uniqueWebsiteSessions,
        };
    });

    const getGrowth = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Number(((current - prev) / prev * 100).toFixed(1));
    };

    type MetricKey = 'views' | 'searches' | 'directions' | 'calls' | 'websites';
    const metricKeys: MetricKey[] = ['views', 'searches', 'directions', 'calls', 'websites'];

    // For each metric, find the store with the highest % growth
    const topByMetric: Record<string, { storeName: string; city: string; growth: number; current: number } | null> = {};

    for (const metric of metricKeys) {
        let best: { storeName: string; city: string; growth: number; current: number } | null = null;
        let bestGrowth = -Infinity;

        for (const r of rows) {
            const sId = r.storeId ?? "unknown";
            const currentVal = metric === 'views' ? r.uniqueViewSessions
                : metric === 'searches' ? r.uniqueSearchSessions
                    : metric === 'directions' ? r.uniqueDirectionSessions
                        : metric === 'calls' ? r.uniqueCallSessions
                            : r.uniqueWebsiteSessions;

            if (currentVal === 0) continue;

            const prevVal = prevMap[sId]?.[metric] ?? 0;
            const growth = getGrowth(currentVal, prevVal);

            if (growth > bestGrowth) {
                bestGrowth = growth;
                best = {
                    storeName: r.store?.storeName ?? r.storeId ?? "Unknown",
                    city: r.store?.city ?? "",
                    growth,
                    current: currentVal,
                };
            }
        }

        topByMetric[metric] = best;
    }

    // Build map for current views to find stores with lowest views
    const currentViewsMap: Record<string, number> = {};
    for (const r of rows) {
        if (r.storeId) currentViewsMap[r.storeId] = r.uniqueViewSessions;
    }
    let lowestViews: { storeName: string; city: string; current: number } | null = null;
    let minViews = Infinity;
    for (const store of allStores) {
        const views = currentViewsMap[store.id] ?? 0;
        if (views < minViews) {
            minViews = views;
            lowestViews = { storeName: store.storeName, city: store.city ?? "", current: views };
        }
    }

    // 1. topViewsGrowth: store with highest % view growth vs previous day
    let topViewsGrowth: { storeName: string; city: string; growth: number; current: number } | null = null;
    let bestViewGrowth = -Infinity;
    for (const r of rows) {
        const sId = r.storeId ?? "unknown";
        const currentViews = r.uniqueViewSessions;
        if (currentViews === 0) continue;
        const prevViews = prevMap[sId]?.views ?? 0;
        const growth = getGrowth(currentViews, prevViews);
        if (growth > bestViewGrowth) {
            bestViewGrowth = growth;
            topViewsGrowth = {
                storeName: r.store?.storeName ?? "Unknown",
                city: r.store?.city ?? "",
                growth,
                current: currentViews,
            };
        }
    }

    // 2. topActivity: store with highest total activity (all metrics combined)
    let topActivity: { storeName: string; city: string; total: number } | null = null;
    let maxActivity = -1;
    for (const r of rows) {
        const total = r.uniqueViewSessions + r.uniqueSearchSessions + r.uniqueDirectionSessions + r.uniqueCallSessions + r.uniqueWebsiteSessions;
        if (total > maxActivity) {
            maxActivity = total;
            topActivity = {
                storeName: r.store?.storeName ?? "Unknown",
                city: r.store?.city ?? "",
                total,
            };
        }
    }

    // 3. highViewLowClick: store with many views but low clicks (directions + calls + websites)
    // Ratio = clicks / views. A low ratio means poor conversion.
    let highViewLowClick: { storeName: string; city: string; views: number; clicks: number; ratio: number } | null = null;
    let worstRatio = Infinity;
    for (const r of rows) {
        if (r.uniqueViewSessions < 5) continue; // ignore stores with very few views
        const clicks = r.uniqueDirectionSessions + r.uniqueCallSessions + r.uniqueWebsiteSessions;
        const ratio = clicks / r.uniqueViewSessions;
        if (ratio < worstRatio) {
            worstRatio = ratio;
            highViewLowClick = {
                storeName: r.store?.storeName ?? "Unknown",
                city: r.store?.city ?? "",
                views: r.uniqueViewSessions,
                clicks,
                ratio: Math.round(ratio * 100),
            };
        }
    }

    return {
        topViewsGrowth,
        topActivity,
        highViewLowClick,
        lowestViews,
        date: start.toISOString()
    };
}


export async function getWeeklyReportStats(shop: string, date: Date) {
    // Get shops connected via B2B
    const connections = await prisma.shopConnection.findMany({
        where: { targetShop: shop },
        select: { sourceShop: true }
    });
    const sourceShops = connections.map(c => c.sourceShop);
    const allShops = [shop, ...sourceShops];

    const refDate = new Date(date);
    const dayOfWeek = refDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Current week = Last full Monday-Sunday period before refDate
    // If refDate is Monday (1), go back 1 day to Sunday.
    // If refDate is Sunday (0), go back 7 days to previous Sunday?
    // Usually reports are sent on Monday, so dayOfWeek=1.
    const offsetToSun = dayOfWeek === 0 ? 7 : dayOfWeek;
    const currentEnd = new Date(refDate);
    currentEnd.setDate(refDate.getDate() - offsetToSun);
    currentEnd.setHours(23, 59, 59, 999);

    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentEnd.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);

    // Prev week
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(currentStart.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevEnd.getDate() - 6);
    prevStart.setHours(0, 0, 0, 0);

    const [currentRows, prevRows] = await Promise.all([
        prisma.storeDailyStat.findMany({
            where: { shop: { in: allShops }, date: { gte: currentStart, lte: currentEnd } },
            include: { store: { select: { storeName: true, city: true } } }
        }),
        prisma.storeDailyStat.findMany({
            where: { shop: { in: allShops }, date: { gte: prevStart, lte: prevEnd } }
        })
    ]);

    const getGrowth = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Number(((current - prev) / prev * 100).toFixed(1));
    };

    // Aggregate per-store totals for current week
    const currentStoreMap: Record<string, any> = {};
    currentRows.forEach(r => {
        const sId = r.storeId || "unknown_store";
        if (!currentStoreMap[sId]) {
            currentStoreMap[sId] = {
                storeId: r.storeId,
                storeName: r.store?.storeName ?? "Unknown",
                city: r.store?.city ?? "",
                views: 0, searches: 0, directions: 0, calls: 0, websites: 0
            };
        }
        const s = currentStoreMap[sId];
        s.views += r.uniqueViewSessions;
        s.searches += r.uniqueSearchSessions;
        s.directions += r.uniqueDirectionSessions;
        s.calls += r.uniqueCallSessions;
        s.websites += r.uniqueWebsiteSessions;
    });

    // Aggregate per-store totals for previous week
    const prevStoreMap: Record<string, { views: number; searches: number; directions: number; calls: number; websites: number }> = {};
    prevRows.forEach(r => {
        const sId = r.storeId || "unknown_store";
        if (!prevStoreMap[sId]) {
            prevStoreMap[sId] = { views: 0, searches: 0, directions: 0, calls: 0, websites: 0 };
        }
        const p = prevStoreMap[sId];
        p.views += r.uniqueViewSessions;
        p.searches += r.uniqueSearchSessions;
        p.directions += r.uniqueDirectionSessions;
        p.calls += r.uniqueCallSessions;
        p.websites += r.uniqueWebsiteSessions;
    });

    // 1. Tổng views tuần này và tuần trước → % tăng/giảm
    const totalViewsCurrent = Object.values(currentStoreMap).reduce((sum, s) => sum + s.views, 0);
    const totalViewsPrev = Object.values(prevStoreMap).reduce((sum, p) => sum + p.views, 0);
    const totalViewsGrowth = getGrowth(totalViewsCurrent, totalViewsPrev);
    const totalViews = {
        current: totalViewsCurrent,
        prev: totalViewsPrev,
        growth: totalViewsGrowth,
    };

    // 2. Store có view cao nhất tuần này
    let topViewsStore: { storeName: string; city: string; views: number } | null = null;
    let maxViews = -1;
    for (const s of Object.values(currentStoreMap)) {
        if (s.views > maxViews) {
            maxViews = s.views;
            topViewsStore = { storeName: s.storeName, city: s.city, views: s.views };
        }
    }

    // 3. Store đc tìm kiếm nhiều nhất tuần này
    let topSearchStore: { storeName: string; city: string; searches: number } | null = null;
    let maxSearches = -1;
    for (const s of Object.values(currentStoreMap)) {
        if (s.searches > maxSearches) {
            maxSearches = s.searches;
            topSearchStore = { storeName: s.storeName, city: s.city, searches: s.searches };
        }
    }

    // 4. Ngày có tổng activity cao nhất tuần này
    const dailyData: Record<string, number> = {};
    currentRows.forEach(r => {
        const d = r.date.toISOString().split("T")[0];
        dailyData[d] = (dailyData[d] || 0) + r.uniqueViewSessions + r.uniqueSearchSessions + r.uniqueDirectionSessions + r.uniqueCallSessions + r.uniqueWebsiteSessions;
    });
    let peakDate = "";
    let peakValue = 0;
    Object.entries(dailyData).forEach(([d, val]) => {
        if (val > peakValue) { peakValue = val; peakDate = d; }
    });
    const peakDay = peakDate ? { date: peakDate, value: peakValue } : null;

    return {
        totalViews,
        topViewsStore,
        topSearchStore,
        peakDay,
        range: { start: currentStart.toISOString(), end: currentEnd.toISOString() }
    };
}

export async function getMonthlyReportStats(shop: string, date: Date) {
    // Get shops connected via B2B
    const connections = await prisma.shopConnection.findMany({
        where: { targetShop: shop },
        select: { sourceShop: true }
    });
    const sourceShops = connections.map(c => c.sourceShop);
    const allShops = [shop, ...sourceShops];

    const refDate = new Date(date);
    // Current month = last calendar month relative to 'date'
    const currentMonthEnd = new Date(refDate.getFullYear(), refDate.getMonth(), 0, 23, 59, 59, 999);
    const currentMonthStart = new Date(currentMonthEnd.getFullYear(), currentMonthEnd.getMonth(), 1, 0, 0, 0, 0);

    // Previous month
    const prevMonthEnd = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 0, 23, 59, 59, 999);
    const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1, 0, 0, 0, 0);

    const [currentRows, prevRows] = await Promise.all([
        prisma.storeDailyStat.findMany({
            where: { shop: { in: allShops }, date: { gte: currentMonthStart, lte: currentMonthEnd } },
            include: { store: { select: { storeName: true, city: true } } }
        }),
        prisma.storeDailyStat.findMany({
            where: { shop: { in: allShops }, date: { gte: prevMonthStart, lte: prevMonthEnd } }
        })
    ]);

    const getGrowth = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return Number(((current - prev) / prev * 100).toFixed(1));
    };

    // Aggregate per-store for current month
    const storeMap: Record<string, { storeName: string; city: string; views: number; searches: number; directions: number; calls: number; websites: number }> = {};
    currentRows.forEach(r => {
        const sId = r.storeId || "unknown";
        if (!storeMap[sId]) {
            storeMap[sId] = { storeName: r.store?.storeName ?? "Unknown", city: r.store?.city ?? "", views: 0, searches: 0, directions: 0, calls: 0, websites: 0 };
        }
        const s = storeMap[sId];
        s.views += r.uniqueViewSessions;
        s.searches += r.uniqueSearchSessions;
        s.directions += r.uniqueDirectionSessions;
        s.calls += r.uniqueCallSessions;
        s.websites += r.uniqueWebsiteSessions;
    });

    // 1. Total views this month vs last month
    const totalViewsCurrent = Object.values(storeMap).reduce((sum, s) => sum + s.views, 0);
    const totalViewsPrev = prevRows.reduce((sum, r) => sum + r.uniqueViewSessions, 0);
    const totalViews = { current: totalViewsCurrent, prev: totalViewsPrev, growth: getGrowth(totalViewsCurrent, totalViewsPrev) };

    // 2. Store with most total activity
    let topActivityStore: { storeName: string; city: string; total: number } | null = null;
    let maxActivity = -1;
    for (const s of Object.values(storeMap)) {
        const total = s.views + s.searches + s.directions + s.calls + s.websites;
        if (total > maxActivity) { maxActivity = total; topActivityStore = { storeName: s.storeName, city: s.city, total }; }
    }

    // 3. Top 3 stores by engagement score: directions*5 + calls*4 + websites*3 + views*1
    const top3Stores = Object.values(storeMap)
        .map(s => ({ storeName: s.storeName, city: s.city, score: s.directions * 5 + s.calls * 4 + s.websites * 3 + s.views * 1 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    return {
        totalViews,
        topActivityStore,
        top3Stores,
        range: { start: currentMonthStart.toISOString(), end: currentMonthEnd.toISOString() }
    };
}
