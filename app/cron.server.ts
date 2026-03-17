// import prisma from "./db.server";
// import { sendEmailReport } from "./utils/emailReport.server";

// declare global {
//     // eslint-disable-next-line no-var
//     var __cronInterval: ReturnType<typeof setInterval> | undefined;
// }

// export function startCron() {
//     // Clear interval cũ trước khi tạo mới (fix hot reload issue)
//     if (global.__cronInterval) {
//         clearInterval(global.__cronInterval);
//         global.__cronInterval = undefined;
//     }

//     global.__cronInterval = setInterval(async () => {
//         try {
//             const now = new Date();
//             const currentHrMin = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
//             const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
//             const currentDate = now.getDate();

//             // Check for automated email reports
//             const settings = await prisma.reportSetting.findMany({
//                 where: {
//                     OR: [
//                         { daily: true, dailyTime: currentHrMin },
//                         { weekly: true, dayOfWeek: currentDayName, weeklyTime: currentHrMin },
//                         { monthly: true, dayOfMonth: currentDate, monthlyTime: currentHrMin }
//                     ]
//                 }
//             });

//             for (const setting of settings) {
//                 const lastSentDate = setting.lastSentAt ? new Date(setting.lastSentAt).toLocaleDateString() : null;
//                 const todayDate = now.toLocaleDateString();

//                 if (lastSentDate === todayDate) continue;

//                 if (setting.daily && setting.dailyTime === currentHrMin) {
//                     await sendEmailReport(setting, "Daily");
//                 } else if (setting.weekly && setting.dayOfWeek === currentDayName && setting.weeklyTime === currentHrMin) {
//                     await sendEmailReport(setting, "Weekly");
//                 } else if (setting.monthly && setting.dayOfMonth === currentDate && setting.monthlyTime === currentHrMin) {
//                     await sendEmailReport(setting, "Monthly");
//                 }
//             }

//             // Cleanup old data
//             const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
//             await prisma.storeEvent.deleteMany({
//                 where: { createdAt: { lte: oneMinuteAgo } }
//             });

//             const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//             await prisma.storeSession.deleteMany({
//                 where: { date: { lte: oneDayAgo } }
//             });

//         } catch (error) {
//             console.error("[Cron] Error in background job:", error);
//         }
//     }, 60000);
// }

// startCron();

import prisma from "./db.server";
import { createNotification } from "./notifications.server";

declare global {
    // eslint-disable-next-line no-var
    var __cronInterval: ReturnType<typeof setInterval> | undefined;
}

export function startCron() {
    // Clear existing interval to handle HMR (Hot Module Replacement)
    if (global.__cronInterval) {

        clearInterval(global.__cronInterval);
        global.__cronInterval = undefined;
    }

    global.__cronInterval = setInterval(async () => {
        try {
            const now = new Date();
            const currentHrMin = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
            const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' });
            const currentDate = now.getDate();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // 1️⃣ Cleanup: Delete old StoreEvent (older than 24 hours)
            // Essential for unique tracking logic that relies on daily session history
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            await prisma.storeEvent.deleteMany({
                where: {
                    createdAt: { lte: twentyFourHoursAgo }
                }
            });

            // 2️⃣ Cleanup: Delete old StoreSession (older than 1 day)
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            await prisma.storeSession.deleteMany({
                where: {
                    date: { lte: oneDayAgo }
                }
            });

            // 3️⃣ Cleanup: Delete old Notifications based on type
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

            // Identify shops that will have notifications deleted
            const affectedNotifications = await prisma.notification.findMany({
                where: {
                    OR: [
                        { title: "Daily Analytics Report", createdAt: { lte: fourteenDaysAgo } },
                        { title: "Weekly Analytics Report", createdAt: { lte: thirtyDaysAgo } },
                        { title: "Monthly Analytics Report", createdAt: { lte: ninetyDaysAgo } }
                    ]
                },
                select: { shop: true },
                distinct: ['shop']
            });

            await Promise.all([
                prisma.notification.deleteMany({
                    where: { title: "Daily Analytics Report", createdAt: { lte: fourteenDaysAgo } }
                }),
                prisma.notification.deleteMany({
                    where: { title: "Weekly Analytics Report", createdAt: { lte: thirtyDaysAgo } }
                }),
                prisma.notification.deleteMany({
                    where: { title: "Monthly Analytics Report", createdAt: { lte: ninetyDaysAgo } }
                })
            ]);

            // Notify affected shops to refresh their UI
            if (affectedNotifications.length > 0 && global.__io) {
                for (const { shop } of affectedNotifications) {
                    global.__io.emit("notification:new", { shop, type: "cleanup" });
                }
            }

            // 4️⃣ Check for automated notifications for Plus plans only (active/not expired)
            const plusPlans = await prisma.plan.findMany({
                where: {
                    level: "plus",
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: now } }
                    ]
                },
                select: { shop: true }
            });
            const plusShops = plusPlans.map(p => p.shop);

            const settings = await prisma.reportSetting.findMany({
                where: {
                    shop: { in: plusShops },
                    OR: [
                        { inAppDaily: true, dailyTime: currentHrMin },
                        { inAppWeekly: true, dayOfWeek: currentDayName, weeklyTime: currentHrMin },
                        { inAppMonthly: true, dayOfMonth: currentDate, monthlyTime: currentHrMin }
                    ]
                }
            });

            for (const setting of settings) {
                const todayDate = now.toLocaleDateString();

                // ✅ DAILY - independent, check lastDailySentAt separately
                const lastDaily = setting.lastDailySentAt
                    ? new Date(setting.lastDailySentAt).toLocaleDateString()
                    : null;
                if (setting.inAppDaily && setting.dailyTime === currentHrMin && lastDaily !== todayDate) {
                    await createNotification(setting.shop, "Daily Analytics Report", "Your daily analytics report is ready to view.", "info");

                    // Emit real-time event
                    if (global.__io) {
                        global.__io.emit("notification:new", { shop: setting.shop });
                    }

                    await prisma.reportSetting.update({
                        where: { id: setting.id },
                        data: { lastDailySentAt: now }
                    });
                }

                // ✅ WEEKLY - independent, check lastWeeklySentAt separately
                const lastWeekly = setting.lastWeeklySentAt
                    ? new Date(setting.lastWeeklySentAt).toLocaleDateString()
                    : null;
                if (setting.inAppWeekly && setting.dayOfWeek === currentDayName && setting.weeklyTime === currentHrMin && lastWeekly !== todayDate) {
                    await createNotification(setting.shop, "Weekly Analytics Report", "Your weekly analytics report is ready to view.", "info");

                    // Emit real-time event
                    if (global.__io) {
                        global.__io.emit("notification:new", { shop: setting.shop });
                    }

                    await prisma.reportSetting.update({
                        where: { id: setting.id },
                        data: { lastWeeklySentAt: now }
                    });
                }

                // ✅ MONTHLY - independent, check lastMonthlySentAt separately
                const lastMonthly = setting.lastMonthlySentAt
                    ? new Date(setting.lastMonthlySentAt).toLocaleDateString()
                    : null;
                if (setting.inAppMonthly && setting.dayOfMonth === currentDate && setting.monthlyTime === currentHrMin && lastMonthly !== todayDate) {
                    await createNotification(setting.shop, "Monthly Analytics Report", "Your monthly analytics report is ready to view.", "info");

                    // Emit real-time event
                    if (global.__io) {
                        global.__io.emit("notification:new", { shop: setting.shop });
                    }

                    await prisma.reportSetting.update({
                        where: { id: setting.id },
                        data: { lastMonthlySentAt: now }
                    });
                }
            }

        } catch (error) {
            console.error("[Cron] Error:", error);
        }
    }, 60000);
}

// Start core services
startCron();
