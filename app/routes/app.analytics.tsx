import Index from "app/component/analytics/Index";
import prisma from "app/db.server";
import { authenticate } from "app/shopify.server";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;

    const connections = await prisma.shopConnection.findMany({
        where: { targetShop: shop }
    });

    const sourceShops = connections.map(c => c.sourceShop);

    const stats = await prisma.storeDailyStat.findMany({
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
                    image: true
                }
            }
        },
        orderBy: {
            date: "desc"
        }
    });

    return { stats };
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