import prisma from "./db.server";

declare global {
    // eslint-disable-next-line no-var
    var __cronInterval: ReturnType<typeof setInterval> | undefined;
}

export function startCron() {
    if (global.__cronInterval) {
        return;
    }

    console.log("[Cron] Starting cleanup job (runs every 1 minute)...");

    global.__cronInterval = setInterval(async () => {
        try {
            const now = new Date();

            // 1️⃣ Xóa StoreEvent cũ hơn 1 phút
            const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
            const deletedEvents = await prisma.storeEvent.deleteMany({
                where: {
                    createdAt: { lte: oneMinuteAgo }
                }
            });

            if (deletedEvents.count > 0) {
                console.log(`[Cron] Deleted ${deletedEvents.count} StoreEvent(s) older than 1 minute.`);
            }

            // 2️⃣ Xóa StoreSession có date cũ hơn 1 ngày
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const deletedSessions = await prisma.storeSession.deleteMany({
                where: {
                    date: { lte: oneDayAgo }
                }
            });

            if (deletedSessions.count > 0) {
                console.log(`[Cron] Deleted ${deletedSessions.count} StoreSession(s) older than 1 day.`);
            }

        } catch (error) {
            console.error("[Cron] Cleanup error:", error);
        }
    }, 60000); // chạy mỗi 1 phút
}

startCron();
