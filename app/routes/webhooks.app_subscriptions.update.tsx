import type { ActionFunctionArgs } from "react-router";
import shopify, { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, payload, topic } = await authenticate.webhook(request);



    const subscription = (payload as any).app_subscription;
    const status = subscription.status; // ACTIVE, CANCELLED, etc.
    const name = subscription.name; // basic, advanced, plus

    if (status === 'ACTIVE') {
        await db.plan.upsert({
            where: { shop },
            update: { level: name.toLowerCase(), expiresAt: null },
            create: { shop, level: name.toLowerCase(), expiresAt: null },
        });
    } else if (status === 'CANCELLED' || status === 'EXPIRED') {
        // Query Shopify to get the actual currentPeriodEnd for the cancelled sub
        // Using unauthenticated admin because webhook session might not be fully established/active
        const { admin } = await shopify.unauthenticated.admin(shop);
        
        const response = await admin.graphql(
            `#graphql
            query {
                appInstallation {
                    allSubscriptions(first: 10) {
                        edges {
                            node {
                                id
                                name
                                status
                                currentPeriodEnd
                            }
                        }
                    }
                }
            }`
        );

        const json = await response.json();
        const allSubs = json.data?.appInstallation?.allSubscriptions?.edges?.map((e: any) => e.node) || [];
        
        // Find the subscription that triggered the webhook
        const subId = subscription.admin_graphql_api_id;
        const subDetails = allSubs.find((s: any) => s.id === subId);

        if (subDetails && subDetails.currentPeriodEnd) {
            const expiryDate = new Date(subDetails.currentPeriodEnd);
            
            if (expiryDate > new Date()) {
                // Still valid -> Keep level and set expiresAt
                await db.plan.upsert({
                    where: { shop },
                    update: { level: subDetails.name.toLowerCase(), expiresAt: expiryDate },
                    create: { shop, level: subDetails.name.toLowerCase(), expiresAt: expiryDate },
                });
            } else {
                // Really expired -> Basic
                await db.plan.upsert({
                    where: { shop },
                    update: { level: 'basic', expiresAt: null },
                    create: { shop, level: 'basic', expiresAt: null },
                });
            }
        } else {
            // Fallback: Check local DB first, then revert to basic
            const existingPlan = await db.plan.findUnique({ where: { shop } });
            const hasValidGrace = existingPlan && existingPlan.expiresAt && new Date(existingPlan.expiresAt) > new Date();

            if (!hasValidGrace) {
                await db.plan.upsert({
                    where: { shop },
                    update: { level: 'basic', expiresAt: null },
                    create: { shop, level: 'basic', expiresAt: null },
                });
            }
        }
    }

    return new Response();
};
