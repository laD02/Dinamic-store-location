import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    const subscription = (payload as any).app_subscription;
    const status = subscription.status; // ACTIVE, CANCELLED, etc.
    const name = subscription.name; // basic, advanced, plus

    if (status === 'ACTIVE') {
        await db.plan.upsert({
            where: { shop },
            update: { level: name.toLowerCase() },
            create: { shop, level: name.toLowerCase() },
        });
    } else if (status === 'CANCELLED' || status === 'EXPIRED') {
        await db.plan.upsert({
            where: { shop },
            update: { level: 'basic' },
            create: { shop, level: 'basic' },
        });
    }

    return new Response();
};
