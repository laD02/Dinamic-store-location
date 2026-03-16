import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const plan = params.id;

    let price: number | null = null;
    if (plan === "basic") {
        // Fetch active subscriptions to cancel
        const activeSubscriptionsResponse = await admin.graphql(
            `#graphql
            query {
                appInstallation {
                    activeSubscriptions {
                        id
                        name
                        status
                        currentPeriodEnd
                    }
                }
            }`
        );

        const activeSubscriptionsJson = await activeSubscriptionsResponse.json();
        const activeSubscription = activeSubscriptionsJson.data?.appInstallation?.activeSubscriptions?.[0];

        if (activeSubscription && activeSubscription.status === 'ACTIVE') {
            // 1. Store expiration info BEFORE canceling
            await prisma.plan.upsert({
                where: { shop: session.shop },
                update: {
                    level: activeSubscription.name.toLowerCase(),
                    expiresAt: new Date(activeSubscription.currentPeriodEnd)
                },
                create: {
                    shop: session.shop,
                    level: activeSubscription.name.toLowerCase(),
                    expiresAt: new Date(activeSubscription.currentPeriodEnd)
                },
            });

            // 2. Cancel on Shopify
            await admin.graphql(
                `#graphql
                mutation AppSubscriptionCancel($id: ID!) {
                    appSubscriptionCancel(id: $id) {
                        userErrors {
                            field
                            message
                        }
                    }
                }`,
                {
                    variables: {
                        id: activeSubscription.id,
                    },
                }
            );
        } else {
            // PROTECTION: Don't wipe the grace period if it already exists
            const existingPlan = await prisma.plan.findUnique({ where: { shop: session.shop } });
            const hasValidGrace = existingPlan && existingPlan.expiresAt && new Date(existingPlan.expiresAt) > new Date();

            if (!hasValidGrace) {
                await prisma.plan.upsert({
                    where: { shop: session.shop },
                    update: { level: "basic", expiresAt: null },
                    create: { shop: session.shop, level: "basic", expiresAt: null },
                });
            }
        }
        throw new Response(null, {
            status: 302,
            headers: {
                Location: "/app/plan",
            },
        });
    }
    if (plan === "advanced") price = 30;
    if (plan === "plus") price = 50;

    if (price === null) {
        throw new Error("Invalid plan selected");
    }

    const variables = {
        name: `${plan}`,
        returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_APP_NAME || 'app-1972'}/app/plan`,
        trialDays: 3,
        lineItems: [
            {
                plan: {
                    appRecurringPricingDetails: {
                        price: {
                            amount: price,
                            currencyCode: "USD",
                        },
                        interval: "EVERY_30_DAYS",
                    },
                },
            },
        ],
    };

    const response = await admin.graphql(
        `#graphql
    mutation AppSubscriptionCreate(
      $name: String!,
      $returnUrl: URL!,
      $lineItems: [AppSubscriptionLineItemInput!]!
    ) {
      appSubscriptionCreate(
        name: $name,
        returnUrl: $returnUrl,
        lineItems: $lineItems
      ) {
        confirmationUrl
        userErrors {
          field
          message
        }
      }
    }`,
        { variables }
    );

    const json = await response.json();

    const data = json.data?.appSubscriptionCreate;

    if (data?.userErrors?.length) {
        throw new Error(data.userErrors[0].message);
    }

    const confirmationUrl = data?.confirmationUrl;

    if (!confirmationUrl) {
        throw new Error("No confirmation URL returned from Shopify");
    }

    return { confirmationUrl };
};

export default function ChargeRedirect() {
    const data = useLoaderData<typeof loader>();
    const shopify = useAppBridge();

    useEffect(() => {
        if (data?.confirmationUrl) {
            try {
                if (shopify && (shopify as any).open) {
                    (shopify as any).open(data.confirmationUrl, { target: "_top" });
                } else {
                    window.top!.location.href = data.confirmationUrl;
                }
            } catch (e) {
                window.location.href = data.confirmationUrl;
            }
        }
    }, [data, shopify]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: 'center', height: "100vh", gap: "20px" }}>
            <p>Redirecting to Shopify payment page...</p>
            <a href={data?.confirmationUrl} style={{ textDecoration: 'underline', color: 'blue' }}>
                Click here if you are not redirected automatically
            </a>
        </div>
    );
}