// import prisma from "./prisma.server";

import prisma from "./db.server";

declare global {
    // eslint-disable-next-line no-var
    var __cronInterval: ReturnType<typeof setInterval> | undefined;
}

export function startCron() {
    if (global.__cronInterval) {
        return;
    }

    console.log("Starting StoreDailyStat aggregation cron job (runs every 1 minute)...");

    global.__cronInterval = setInterval(async () => {
        try {
            // Lấy tất cả các sự kiện chưa được tổng hợp (trước thời điểm hiện tại)
            const now = new Date();
            const eventsToProcess = await prisma.storeEvent.findMany({
                where: {
                    createdAt: {
                        lte: now
                    }
                }
            });

            if (eventsToProcess.length === 0) {
                return;
            }

            // Object để nhóm dữ liệu: key = `${shop}_${storeId}_${dateString}`
            const aggregation: Record<string, {
                shop: string,
                storeId: string | null,
                date: Date,
                searchCount: number,
                viewCount: number,
                directionCount: number,
                callCount: number,
                websiteCount: number,
                eventIds: string[]
            }> = {};

            for (const event of eventsToProcess) {
                // Đưa date về 00:00:00 UTC để chuẩn hoá với StoreDailyStat
                const eventDate = new Date(event.createdAt);
                eventDate.setUTCHours(0, 0, 0, 0);

                // Mặc định storeId là "null" dưới dạng string cho logic gom nhóm nếu không có storeId
                const safeStoreId = event.storeId || "null";
                const key = `${event.shop}_${safeStoreId}_${eventDate.toISOString()}`;

                if (!aggregation[key]) {
                    aggregation[key] = {
                        shop: event.shop,
                        storeId: event.storeId,
                        date: eventDate,
                        searchCount: 0,
                        viewCount: 0,
                        directionCount: 0,
                        callCount: 0,
                        websiteCount: 0,
                        eventIds: []
                    };
                }

                aggregation[key].eventIds.push(event.id);

                switch (event.eventType) {
                    case "SEARCH":
                        aggregation[key].searchCount++;
                        break;
                    case "VIEW_STORE":
                        aggregation[key].viewCount++;
                        break;
                    case "CLICK_DIRECTION":
                        aggregation[key].directionCount++;
                        break;
                    case "CLICK_CALL":
                        aggregation[key].callCount++;
                        break;
                    case "CLICK_WEBSITE":
                        aggregation[key].websiteCount++;
                        break;
                }
            }

            // Upsert vào database & xóa events đã xử lý
            let processedEventCount = 0;

            for (const key in aggregation) {
                const data = aggregation[key];

                await prisma.$transaction(async (tx) => {
                    const existingStat = await tx.storeDailyStat.findFirst({
                        where: {
                            shop: data.shop,
                            storeId: data.storeId ?? null,
                            date: data.date
                        }
                    });

                    if (existingStat) {
                        await tx.storeDailyStat.update({
                            where: { id: existingStat.id },
                            data: {
                                searchCount: { increment: data.searchCount },
                                viewCount: { increment: data.viewCount },
                                directionCount: { increment: data.directionCount },
                                callCount: { increment: data.callCount },
                                websiteCount: { increment: data.websiteCount },
                            }
                        });
                    } else {
                        await tx.storeDailyStat.create({
                            data: {
                                shop: data.shop,
                                storeId: data.storeId ?? null,
                                date: data.date,
                                searchCount: data.searchCount,
                                viewCount: data.viewCount,
                                directionCount: data.directionCount,
                                callCount: data.callCount,
                                websiteCount: data.websiteCount,
                            }
                        });
                    }

                    // Xóa các event đã được cộng dồn thành công
                    await tx.storeEvent.deleteMany({
                        where: {
                            id: {
                                in: data.eventIds
                            }
                        }
                    });
                });
                processedEventCount += data.eventIds.length;
            }

            if (processedEventCount > 0) {
                console.log(`[Cron] Aggregated and deleted ${processedEventCount} StoreEvent records.`);
            }

        } catch (error) {
            console.error("[Cron] Error aggregating StoreEvents:", error);
        }
    }, 60000); // 1 phút
}

startCron();
