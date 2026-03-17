import Index from "app/component/analytics/detail";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { getEffectiveLevel } from "app/utils/plan.server";
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData } from "react-router";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    const { id } = params;

    const level = await getEffectiveLevel(shop);

    // Lấy thông tin store
    const storeInfo = await prisma.store.findUnique({
        where: { id },
        select: { storeName: true, image: true, address: true, city: true, state: true, region: true, code: true }
    });

    // Lấy tất cả daily stats của store này, sort theo ngày tăng dần
    const dailyStats = await prisma.storeDailyStat.findMany({
        where: { storeId: id },
        orderBy: { date: "asc" }
    });

    // Tổng hợp tổng (dùng unique session fields)
    let totals = dailyStats.reduce((acc, stat) => ({
        uniqueViewSessions: acc.uniqueViewSessions + stat.uniqueViewSessions,
        uniqueSearchSessions: acc.uniqueSearchSessions + stat.uniqueSearchSessions,
        uniqueCallSessions: acc.uniqueCallSessions + stat.uniqueCallSessions,
        uniqueDirectionSessions: acc.uniqueDirectionSessions + stat.uniqueDirectionSessions,
        uniqueWebsiteSessions: acc.uniqueWebsiteSessions + stat.uniqueWebsiteSessions,
    }), { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 });

    let finalDailyStats = dailyStats;
    if (level !== 'plus') {
        finalDailyStats = dailyStats.map(stat => ({
            ...stat,
            uniqueViewSessions: 0,
            uniqueSearchSessions: 0,
            uniqueCallSessions: 0,
            uniqueDirectionSessions: 0,
            uniqueWebsiteSessions: 0,
        }));
        totals = {
            uniqueViewSessions: 0,
            uniqueSearchSessions: 0,
            uniqueCallSessions: 0,
            uniqueDirectionSessions: 0,
            uniqueWebsiteSessions: 0,
        };
    }

    return {
        store: {
            store: storeInfo,
            dailyStats: finalDailyStats,
            ...totals,
        },
        level
    }
}

export async function action({ request }: ActionFunctionArgs) {
    return {}
}

export default function AnalyticDetail() {
    const { level } = useLoaderData<typeof loader>();
    const isPlus = level === 'plus';

    return (
        <s-page heading="Store Locator">
            <Index />

            <s-stack alignItems="center" paddingBlock="large-200">
                <s-text>
                    Learn more about <span style={{ color: 'blue' }}><s-link href="">Analytics section</s-link></span>
                </s-text>
            </s-stack>
        </s-page>
    );
}