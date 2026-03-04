import Index from "app/component/analytics/detail";
import prisma from "app/db.server";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { id } = params;

    // Lấy thông tin store
    const storeInfo = await prisma.store.findUnique({
        where: { id },
        select: { storeName: true, image: true, address: true, city: true, state: true }
    });

    // Lấy tất cả daily stats của store này, sort theo ngày tăng dần
    const dailyStats = await prisma.storeDailyStat.findMany({
        where: { storeId: id },
        orderBy: { date: "asc" }
    });

    // Tổng hợp tổng (dùng unique session fields)
    const totals = dailyStats.reduce((acc, stat) => ({
        uniqueViewSessions: acc.uniqueViewSessions + stat.uniqueViewSessions,
        uniqueSearchSessions: acc.uniqueSearchSessions + stat.uniqueSearchSessions,
        uniqueCallSessions: acc.uniqueCallSessions + stat.uniqueCallSessions,
        uniqueDirectionSessions: acc.uniqueDirectionSessions + stat.uniqueDirectionSessions,
        uniqueWebsiteSessions: acc.uniqueWebsiteSessions + stat.uniqueWebsiteSessions,
    }), { uniqueViewSessions: 0, uniqueSearchSessions: 0, uniqueCallSessions: 0, uniqueDirectionSessions: 0, uniqueWebsiteSessions: 0 });

    return {
        store: {
            store: storeInfo,
            dailyStats,
            ...totals,
        }
    }
}

export async function action({ request }: ActionFunctionArgs) {

    return {

    }
}

export default function AnalyticDetail() {
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