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

    // Tổng hợp tổng
    const totals = dailyStats.reduce((acc, stat) => ({
        viewCount: acc.viewCount + stat.viewCount,
        searchCount: acc.searchCount + stat.searchCount,
        callCount: acc.callCount + stat.callCount,
        directionCount: acc.directionCount + stat.directionCount,
        websiteCount: acc.websiteCount + stat.websiteCount,
    }), { viewCount: 0, searchCount: 0, callCount: 0, directionCount: 0, websiteCount: 0 });

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
        </s-page>
    );
}