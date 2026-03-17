import Index from "app/component/analytics/Index";
import BannerUpgrade from "app/component/BannerUpgrade";
import NotificationCenter from "app/component/NotificationCenter";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { getEffectiveLevel } from "../utils/plan.server";
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;

    const level = await getEffectiveLevel(shop);
    // Remove redirect
    // if (!plan || plan.level === 'basic') {
    //     throw new Response(null, { status: 302, headers: { Location: "/app/plan" } });
    // }

    const connections = level === 'plus'
        ? await prisma.shopConnection.findMany({
            where: { targetShop: shop }
        })
        : [];

    const sourceShops = connections.map(c => c.sourceShop);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [stats, allStores] = await Promise.all([
        prisma.storeDailyStat.findMany({
            where: {
                OR: [
                    { shop },
                    { shop: { in: sourceShops } }
                ],
                date: { gte: ninetyDaysAgo }
            },
            select: {
                id: true,
                shop: true,
                storeId: true,
                date: true,
                uniqueSessions: true,
                uniqueViewSessions: true,
                uniqueSearchSessions: true,
                uniqueCallSessions: true,
                uniqueDirectionSessions: true,
                uniqueWebsiteSessions: true,
                store: {
                    select: {
                        id: true,
                        storeName: true,
                        address: true,
                        city: true,
                        region: true,
                        image: true,
                        code: true,
                    }
                }
            },
            orderBy: { date: "desc" }
        }),
        prisma.store.findMany({
            where: {
                OR: [
                    { shop },
                    ...(sourceShops.length ? [{ shop: { in: sourceShops } }] : [])
                ]
            },
            select: {
                id: true,
                shop: true,
                storeName: true,
                address: true,
                city: true,
                region: true,
                image: true,
                code: true,
            }
        })
    ]);

    // Tìm store nào chưa có stat -> inject row 0
    const storeIdsWithStat = new Set(stats.map((s: any) => s.storeId));
    const zeroStats: any[] = allStores
        .filter((s: any) => !storeIdsWithStat.has(s.id))
        .map((s: any) => ({
            id: `zero-${s.id}`,
            shop: s.shop,
            storeId: s.id,
            date: new Date(),
            uniqueSessions: 0,
            uniqueViewSessions: 0,
            uniqueSearchSessions: 0,
            uniqueCallSessions: 0,
            uniqueDirectionSessions: 0,
            uniqueWebsiteSessions: 0,
            store: {
                id: s.id,
                storeName: s.storeName,
                address: s.address,
                city: s.city,
                region: s.region,
                image: s.image,
                code: s.code,
            },
        }));

    let finalStats = [...stats, ...zeroStats];
    if (level === 'basic') {
        finalStats = finalStats.map((s: any) => ({
            ...s,
            uniqueSessions: 0,
            uniqueViewSessions: 0,
            uniqueSearchSessions: 0,
            uniqueCallSessions: 0,
            uniqueDirectionSessions: 0,
            uniqueWebsiteSessions: 0,
        }));
    }

    return { stats: finalStats, level: level };
}

export async function action({ request }: ActionFunctionArgs) {
    return {

    }
}

export default function Analytics() {
    const { level } = useLoaderData<typeof loader>();
    const isBasic = level === 'basic';

    return (
        <s-page heading="Store Locator">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                <s-stack direction="inline" alignItems="center" gap="small-400">
                    <s-icon type="chart-vertical"></s-icon>
                    <h2>Analytics</h2>
                </s-stack>
                <s-stack direction="inline" gap="small-400" alignItems="center">
                    <s-button commandFor="export-menu" icon="export" disabled={isBasic}>Export</s-button>
                    {level === 'plus' && <NotificationCenter />}
                </s-stack>
            </s-stack>

            {isBasic && (
                <BannerUpgrade currentLevel={level} requiredLevel="advanced" featureName="Analytics" />
            )}
            <div style={{ opacity: isBasic ? 0.5 : 1, pointerEvents: isBasic ? 'none' : 'auto' }}>
                <Index />
            </div>

            <s-stack alignItems="center" paddingBlock="large-200">
                <s-text>
                    Learn more about <span style={{ color: 'blue' }}><s-link href="">Analytics section</s-link></span>
                </s-text>
            </s-stack>
        </s-page>
    );
}