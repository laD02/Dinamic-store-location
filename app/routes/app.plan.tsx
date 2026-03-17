import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData, useNavigate, useFetcher } from "react-router"
import styles from "../css/plan.module.css"
import prisma from "app/db.server"
import { authenticate } from "../shopify.server"
import { useAppBridge } from "@shopify/app-bridge-react"
import { useEffect } from "react"

export async function loader({ request }: LoaderFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);

    // Fetch active subscriptions from Shopify
    const response = await admin.graphql(
        `#graphql
        query {
            appInstallation {
                activeSubscriptions {
                    id
                    name
                    status
                    currentPeriodEnd
                    trialDays
                }
            }
        }`
    );

    const json = await response.json();
    const subscriptions = json.data?.appInstallation?.activeSubscriptions || [];

    let currentLevel = 'basic';
    let expiresAt: Date | null = null;
    let trialInfo: { name: string, days: number } | null = null;
    let isGracePeriod = false;
    let actualLevel = 'basic'; // The level they have access to

    // 1. Check for an ACTIVE subscription from Shopify
    const activeSub = subscriptions.find((sub: any) => sub.status === 'ACTIVE');
    if (activeSub) {
        actualLevel = activeSub.name.toLowerCase();
        currentLevel = actualLevel;
        // If it's in trial, set expiresAt to the end of the period
        if (activeSub.trialDays > 0) {
            expiresAt = new Date(activeSub.currentPeriodEnd);
            trialInfo = { name: activeSub.name.toLowerCase(), days: activeSub.trialDays };
        } else {
            expiresAt = null; // Recurring paid period
        }
    }
    // 2. If no ACTIVE sub, check our database for a grace period (expiresAt in the future)
    else {
        const dbPlan = await prisma.plan.findUnique({ where: { shop: session.shop } });
        if (dbPlan && dbPlan.expiresAt && new Date(dbPlan.expiresAt) > new Date()) {
            actualLevel = dbPlan.level;
            currentLevel = 'basic'; // For UI logic, they have moved to basic (cancelled)
            expiresAt = new Date(dbPlan.expiresAt);
            isGracePeriod = true;
        } else {
            actualLevel = 'basic';
            currentLevel = 'basic';
            expiresAt = null;
        }
    }

    // 3. Update local database ONLY if changed to avoid race conditions/redundant writes
    const existingPlan = await prisma.plan.findUnique({ where: { shop: session.shop } });

    // Convert to ISO string for comparison if not null
    const newExpiresAt = expiresAt ? expiresAt.toISOString() : null;
    const oldExpiresAt = existingPlan?.expiresAt ? existingPlan.expiresAt.toISOString() : null;

    // Note: In DB, we store the 'actualLevel' (entitlement) to ensure feature gating works
    if (!existingPlan || existingPlan.level !== actualLevel || oldExpiresAt !== newExpiresAt) {
        await prisma.plan.upsert({
            where: { shop: session.shop },
            update: { level: actualLevel, expiresAt: expiresAt },
            create: { shop: session.shop, level: actualLevel, expiresAt: expiresAt },
        });
    }

    return { currentLevel, actualLevel, isGracePeriod, expiresAt: expiresAt?.toISOString() || null, trialInfo };
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const plan = formData.get("plan") as string;

    try {
        if (plan === "basic") {
            // Check for active subscriptions to cancel
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
                // PROTECTION: If they select basic but we already have a grace period in DB, DO NOT wipe it.
                // Only reset if they were already basic or has no valid grace period.
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

            return { success: true, redirect: "/app/plan" };
        }

        let price = 0;
        if (plan === "advanced") price = 9.99;
        if (plan === "plus") price = 19.99;

        const response = await admin.graphql(
            `#graphql
        mutation AppSubscriptionCreate(
          $name: String!,
          $returnUrl: URL!,
          $trialDays: Int,
          $lineItems: [AppSubscriptionLineItemInput!]!
        ) {
          appSubscriptionCreate(
            name: $name,
            returnUrl: $returnUrl,
            trialDays: $trialDays,
            lineItems: $lineItems
          ) {
            confirmationUrl
            userErrors { field message }
          }
        }`,
            {
                variables: {
                    name: plan,
                    returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_APP_NAME || 'app-1972'}/app/plan`,
                    trialDays: 3,
                    lineItems: [{
                        plan: {
                            appRecurringPricingDetails: {
                                price: { amount: price, currencyCode: "USD" },
                                interval: "EVERY_30_DAYS",
                            },
                        },
                    }],
                },
            }
        );

        const json = await response.json();
        const data = json.data?.appSubscriptionCreate;

        if (data?.userErrors?.length) {
            console.error("Plan selection errors:", data.userErrors);
            return { error: data.userErrors[0].message };
        }

        if (!data?.confirmationUrl) {
            console.warn("No confirmation URL for plan:", plan);
        }

        return { confirmationUrl: data?.confirmationUrl };
    } catch (error) {
        console.error("Action error:", error);
        return { error: "An unexpected error occurred" };
    }
}

export default function Plan() {
    const { currentLevel, actualLevel, isGracePeriod, expiresAt, trialInfo } = useLoaderData() as {
        currentLevel: string,
        actualLevel: string,
        isGracePeriod: boolean,
        expiresAt: string | null,
        trialInfo: { name: string, days: number } | null
    }
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const shopify = useAppBridge()

    const isLoading = fetcher.state !== "idle"

    useEffect(() => {
        if (fetcher.data?.confirmationUrl) {
            if (shopify && (shopify as any).open) {
                (shopify as any).open(fetcher.data.confirmationUrl, { target: "_top" })
            } else {
                window.top!.location.href = fetcher.data.confirmationUrl
            }
        } else if (fetcher.data?.success && fetcher.data?.redirect) {
            navigate(fetcher.data.redirect)
        } else if (fetcher.data?.error) {
            shopify.toast.show(fetcher.data.error, { isError: true })
        }
    }, [fetcher.data, shopify, navigate])

    const handleSelectPlan = (plan: string) => {
        fetcher.submit({ plan }, { method: "post" })
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerContainer}>
                    <h3>Select a plan</h3>
                </div>
                <p className={styles.subtitle}>Choose the best plan for your store's growing needs</p>
            </div>

            <div className={styles.plansGrid}>
                {/* Basic Plan */}
                <div className={styles.planCardWrapper}>
                    <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="100%" blockSize="100%">
                        <div className={styles.contentFlex}>
                            <s-stack direction="inline" justifyContent="space-between">
                                <div className={styles.titleWrapper}>
                                    <div className={styles.title}>Basic</div>
                                </div>
                            </s-stack>

                            <div className={styles.pricing}>Free</div>
                            <div className={styles.info}></div>

                            <div className={styles.buttonWrapper}>
                                {currentLevel === 'basic' ? (
                                    <div className={styles.currentStatus}>
                                        <i className="fa-solid fa-circle-check"></i>
                                        Current
                                    </div>
                                ) : (
                                    <>
                                        <s-button
                                            variant="primary"
                                            commandFor="downgrade-modal"
                                            loading={isLoading && fetcher.formData?.get('plan') === 'basic'}
                                        >
                                            Select
                                        </s-button>
                                        <s-modal id="downgrade-modal" heading="Downgrade to Basic plan?">
                                            <s-box padding="base">
                                                <s-text>This will cancel your current paid subscription. You will still have access to your current features until the end of your billing cycle.</s-text>
                                            </s-box>
                                            <s-button slot="primary-action" variant="primary" onClick={() => fetcher.submit({ plan: 'basic' }, { method: "post" })} commandFor="downgrade-modal" command="--hide">Confirm Downgrade</s-button>
                                            <s-button slot="secondary-actions" commandFor="downgrade-modal" command="--hide">Cancel</s-button>
                                        </s-modal>
                                    </>
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <div className={styles.list}>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Up to 10 Locations</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Standard Map Themes & Pins</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Search by Name, Address or City</span>
                                </div>
                            </div>
                        </div>
                    </s-stack>
                </div>

                {/* Advanced Plan */}
                <div className={`${styles.planCardWrapper} ${styles.popularCard}`}>
                    <div className={styles.popularBadge}>Most Popular</div>
                    <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="100%" blockSize="100%">
                        <div className={styles.contentFlex}>
                            <s-stack direction="inline" justifyContent="space-between">
                                <div className={styles.titleWrapper}>
                                    <div className={styles.title}>Advanced</div>
                                </div>
                            </s-stack>

                            <div className={styles.pricing}>$9.99 <span>/ 30 days</span></div>
                            <div className={styles.info}>
                                {trialInfo?.name === 'advanced' ? `${trialInfo.days} trial days remaining` : '3 trial days remaining'}
                            </div>

                            <div className={styles.buttonWrapper}>
                                {actualLevel === 'advanced' ? (
                                    <div className={styles.currentStatus}>
                                        <i className={`fa-solid ${isGracePeriod ? 'fa-hourglass-half' : 'fa-circle-check'}`}></i>
                                        {isGracePeriod ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div>Active until</div>
                                                <div style={{ fontSize: '0.8em' }}>{new Date(expiresAt!).toLocaleDateString()}</div>
                                            </div>
                                        ) : 'Current'}
                                    </div>
                                ) : (
                                    <s-button
                                        variant="primary"
                                        onClick={() => handleSelectPlan('advanced')}
                                        loading={isLoading && fetcher.formData?.get('plan') === 'advanced'}
                                    >
                                        Select
                                    </s-button>
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <div className={styles.list}>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Up to 500 Locations</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span><b>Bulk Import/Export (CSV)</b></span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Conversion & Click Tracking</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Export Analytics (PDF/CSV)</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Custom Marker Icons & Brand</span>
                                </div>
                            </div>
                        </div>
                    </s-stack>
                </div>

                {/* Business Plus Plan */}
                <div className={styles.planCardWrapper}>
                    <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="100%" blockSize="100%">
                        <div className={styles.contentFlex}>
                            <s-stack direction="inline" justifyContent="space-between">
                                <div className={styles.titleWrapper}>
                                    <div className={styles.title}>Business Plus</div>
                                </div>
                            </s-stack>

                            <div className={styles.pricing}>$19.99 <span>/ 30 days</span></div>
                            <div className={styles.info}>
                                {trialInfo?.name === 'plus' ? `${trialInfo.days} trial days remaining` : '3 trial days remaining'}
                            </div>

                            <div className={styles.buttonWrapper}>
                                {actualLevel === 'plus' ? (
                                    <div className={styles.currentStatus}>
                                        <i className={`fa-solid ${isGracePeriod ? 'fa-hourglass-half' : 'fa-circle-check'}`}></i>
                                        {isGracePeriod ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <div>Active until</div>
                                                <div style={{ fontSize: '0.8em' }}>{new Date(expiresAt!).toLocaleDateString()}</div>
                                            </div>
                                        ) : 'Current'}
                                    </div>
                                ) : (
                                    <s-button
                                        variant="primary"
                                        onClick={() => handleSelectPlan('plus')}
                                        loading={isLoading && fetcher.formData?.get('plan') === 'plus'}
                                    >
                                        Select
                                    </s-button>
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <div className={styles.list}>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span><b>Unlimited Locations</b></span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span><b>Shopify B2B Integration</b></span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Notification Center & Reports</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Bulk CSV Import/Export</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span><b>Advanced Store Analytics Detail</b></span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Priority Support</span>
                                </div>
                            </div>
                        </div>
                    </s-stack>
                </div>
            </div>
        </div>
    )
}