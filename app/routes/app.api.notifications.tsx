import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, getDailyReportStats, getWeeklyReportStats, getMonthlyReportStats } from "../notifications.server";

export async function loader({ request }: LoaderFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const url = new URL(request.url);
    const intent = url.searchParams.get("intent");

    const plan = await prisma.plan.findUnique({ where: { shop } });
    if (!plan || plan.level !== 'plus') {
        if (intent === "unreadCount") return { unreadCount: 0 };
        return { notifications: [], unreadCount: 0 };
    }

    if (intent === "dailyReport") {
        const dateParam = url.searchParams.get("date");
        // Nếu không có date, dùng hôm qua
        const date = dateParam ? new Date(dateParam) : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return d;
        })();
        const stats = await getDailyReportStats(shop, date);
        return { stats };
    }

    if (intent === "weeklyReport") {
        const dateParam = url.searchParams.get("date");
        const date = dateParam ? new Date(dateParam) : new Date();
        const stats = await getWeeklyReportStats(shop, date);
        return { stats };
    }

    if (intent === "monthlyReport") {
        const dateParam = url.searchParams.get("date");
        const date = dateParam ? new Date(dateParam) : new Date();
        const stats = await getMonthlyReportStats(shop, date);
        return { stats };
    }

    const notifications = await getNotifications(shop);
    const unreadCount = await getUnreadCount(shop);
    return { notifications, unreadCount };
}

export async function action({ request }: ActionFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const formData = await request.formData();
    const intent = formData.get("intent");

    const plan = await prisma.plan.findUnique({ where: { shop } });
    if (!plan || plan.level !== 'plus') {
        return { ok: false, message: "Only available on Business Plus plan" };
    }

    if (intent === "markAsRead") {
        const id = formData.get("id")?.toString();
        if (id) {
            await markAsRead(id);
            return { ok: true };
        }
    }

    if (intent === "markAllAsRead") {
        await markAllAsRead(shop);
        return { ok: true };
    }

    return { ok: false };
}
