
import { LoaderFunctionArgs, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    const { admin, session } = await authenticate.admin(request);
    const shop = session.shop
    const storeHandle = session.shop.replace(".myshopify.com", "");

    const plan = params.id; // 🔥 QUAN TRỌNG

    // ===== BASIC PLAN (FREE) =====
    if (plan === "basic") {
        await prisma.plan.update({
            where: { shop: session.shop },
            data: { level: "basic" },
        });

        return redirect("/app/plan");
    }

    // ===== PAID PLANS =====
    let price: number | null = null;

    if (plan === "advanced") price = 30;
    if (plan === "plus") price = 50;

    if (!price) {
        throw new Error("Invalid plan selected");
    }

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
        {
            variables: {
                name: `${plan}`,
                returnUrl: `https://admin.shopify.com/store/${storeHandle}/apps/app-1972/app/plan`,
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
            },
        }
    );

    const json = await response.json();

    const data = json.data?.appSubscriptionCreate;

    // 🔥 Check Shopify errors trước
    if (data?.userErrors?.length) {
        console.error("Billing error:", data.userErrors);
        throw new Error(data.userErrors[0].message);
    }

    const confirmationUrl = data?.confirmationUrl;
    console.log("Confirmation URL:", confirmationUrl);

    if (!confirmationUrl) {
        throw new Error("No confirmation URL returned from Shopify");
    }

    return redirect(confirmationUrl);
};