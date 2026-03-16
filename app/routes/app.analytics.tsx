import Index from "app/component/analytics/Index";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;

    const plan = await prisma.plan.findUnique({ where: { shop } });
    if (!plan || plan.level === 'basic') {
        throw new Response(null, { status: 302, headers: { Location: "/app/plan" } });
    }

    const connections = await prisma.shopConnection.findMany({
        where: { targetShop: shop }
    });

    const sourceShops = connections.map(c => c.sourceShop);

    const [stats, allStores] = await Promise.all([
        prisma.storeDailyStat.findMany({
            where: {
                OR: [
                    { shop },
                    { shop: { in: sourceShops } }
                ]
            },
            include: {
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

    return { stats: [...stats, ...zeroStats], level: plan.level };
}

export async function action({ request }: ActionFunctionArgs) {
    return {

    }
}

export default function Analytics() {
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