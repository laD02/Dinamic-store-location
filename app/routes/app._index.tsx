import { useEffect, useState } from 'react'
import DesignMap from 'app/component/onboarding/designMap'
import AddMapToStore from 'app/component/onboarding/addMapToStore'
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData, useFetcher } from 'react-router'
import { authenticate } from 'app/shopify.server'
import prisma from 'app/db.server'
import Review from 'app/component/onboarding/review'
import { hasStoreLocatorEmbedEnabled } from 'app/utils/embedStore'
import Integrations from 'app/component/onboarding/integrations'
import Analytic from 'app/component/onboarding/analytic'
import Setting from 'app/component/onboarding/setting'
import Pricing from 'app/component/onboarding/pricing'
import { getEffectiveLevel } from 'app/utils/plan.server'

export async function loader({ request }: LoaderFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);

    const shop = session.shop;
    const storeHandle = shop.replace(".myshopify.com", "");

    const query = `
        query {
        themes(first: 10) {
            edges {
                node {
                    id
                    name
                    role
                }
            }
        }
        }
    `;

    // Fetch shop connections once
    const sourceShopsPromise = prisma.shopConnection.findMany({
        where: { targetShop: shop },
        select: { sourceShop: true }
    }).then(connections => connections.map(c => c.sourceShop));

    // Phase 1: Fetch theme, on-board status, level, and shop connections
    const [themeData, onBoard, level, sourceShops] = await Promise.all([
        admin.graphql(query).then((res: any) => res.json()),
        prisma.onBoard.findFirst({ where: { shop } }),
        getEffectiveLevel(shop),
        sourceShopsPromise
    ]);

    const mainTheme = themeData.data.themes.edges.find(
        (edge: any) => edge.node.role === "MAIN"
    );
    const themeId = mainTheme?.node.id.split("/").pop() || "";

    // Filter sourceShops by plan level
    const effectiveSourceShops = level === 'plus' ? sourceShops : [];

    // Phase 2: Fetch embed status and counts using data from Phase 1
    // CACHE: Trust the database if embed is already enabled
    const cachedEmbed = onBoard?.embedEnabled ?? false;

    const [counts, newEmbedStore] = await Promise.all([
        prisma.store.groupBy({
            by: ['visibility'],
            where: {
                OR: [
                    { shop },
                    { shop: { in: effectiveSourceShops } }
                ]
            },
            _count: true
        }),
        cachedEmbed ? Promise.resolve(true) : hasStoreLocatorEmbedEnabled(session, 'store-locator', themeId)
    ]);

    const visibleCount = counts.find(c => c.visibility === "visible")?._count ?? 0;
    const hiddenCount = counts.find(c => c.visibility === "hidden")?._count ?? 0;
    let embedStore = newEmbedStore;

    // Update cache if it changed to true
    if (newEmbedStore && !cachedEmbed) {
        await prisma.onBoard.upsert({
            where: { shop },
            update: { embedEnabled: true },
            create: { shop, embedEnabled: true, onBoarding: [] }
        });
    }

    return { storeHandle, themeId, onBoard, embedStore, visibleCount, hiddenCount, level }
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request)
    const shop = session.shop

    const formData = await request.formData()
    const actionType = formData.get("actionType") as string
    const remove = formData.get("remove") === "true"

    if (actionType === 'checkAddMap') {
        const embedStore = await hasStoreLocatorEmbedEnabled(session, 'store-locator')
        const verified = embedStore

        if (verified) {
            await prisma.onBoard.upsert({
                where: { shop },
                update: { embedEnabled: true },
                create: { shop, embedEnabled: true, onBoarding: ["addMap"] }
            })
            const existing = await prisma.onBoard.findFirst({
                where: { shop },
            })

            const current = Array.isArray(existing?.onBoarding)
                ? (existing.onBoarding as string[])
                : []

            if (!current.includes("addMap")) {
                await prisma.onBoard.upsert({
                    where: { shop },
                    update: {
                        onBoarding: [...current, "addMap"],
                    },
                    create: {
                        shop,
                        onBoarding: ["addMap"],
                    },
                })
            }
        }

        return { ok: verified }
    }

    // mapping action → onboarding step
    const STEP_MAP: Record<string, string> = {
        saveGoogleMap: "googleMap",
        saveDesignMap: "designMap",
        saveReview: "review",
        saveIntegrations: "integrations",
        saveAddMap: "addMap",
        saveAnalytic: "analytic",
        saveSetting: "setting",
        savePricing: "pricing",
    }

    const step = STEP_MAP[actionType]
    if (!step) {
        return { ok: false, message: "Invalid actionType" }
    }

    // Lấy trạng thái hiện tại
    const existing = await prisma.onBoard.findFirst({
        where: { shop },
    })

    const current = Array.isArray(existing?.onBoarding)
        ? (existing.onBoarding as string[])
        : []

    if (remove) {
        const updated = current.filter((s: string) => s !== step)

        await prisma.onBoard.upsert({
            where: { shop },
            update: {
                onBoarding: updated,
            },
            create: {
                shop,
                onBoarding: [],
            },
        })

        return { ok: true, removed: true }
    }
    // Nếu đã có rồi thì thôi
    if (current.includes(step)) {
        return { ok: true }
    }

    // Lưu onboarding
    await prisma.onBoard.upsert({
        where: { shop },
        update: {
            onBoarding: [...current, step],
        },
        create: {
            shop,
            onBoarding: [step],
        },
    })

    return { ok: true }
}

export default function Onboarding() {
    const [index, setIndex] = useState<number>(1)
    const [count, setCount] = useState(0)
    const { storeHandle, themeId, onBoard, embedStore, visibleCount, hiddenCount, level } = useLoaderData()

    const locationLimit = level === 'plus' ? 'Unlimited' : (level === 'advanced' ? '50' : '10')

    const designFetcher = useFetcher()
    const reviewFetcher = useFetcher()
    const integrationsFetcher = useFetcher()
    const analyticFetcher = useFetcher()
    const settingFetcher = useFetcher()
    const pricingFetcher = useFetcher()
    const addMapFetcher = useFetcher()

    function getOptimisticState(
        step: string,
        fetcher: ReturnType<typeof useFetcher>,
        initialState: boolean
    ) {
        if (fetcher.formData) {
            const actionType = fetcher.formData.get("actionType")
            const remove = fetcher.formData.get("remove") === "true"
            if (actionType === `save${step.charAt(0).toUpperCase() + step.slice(1)}`) {
                return !remove
            }
        }
        return onBoard?.onBoarding?.includes(step) || initialState
    }

    const design = getOptimisticState("designMap", designFetcher, false)
    const review = getOptimisticState("review", reviewFetcher, false)
    const integrations = getOptimisticState("integrations", integrationsFetcher, false)
    const analytic = getOptimisticState("analytic", analyticFetcher, false)
    const setting = getOptimisticState("setting", settingFetcher, false)
    const pricing = getOptimisticState("pricing", pricingFetcher, false)
    const addMap = getOptimisticState("addMap", addMapFetcher, false)

    const handleCheck = (step: string, check: boolean) => {
        const fetcherMap: Record<string, any> = {
            designMap: designFetcher,
            review: reviewFetcher,
            integrations: integrationsFetcher,
            analytic: analyticFetcher,
            setting: settingFetcher,
            pricing: pricingFetcher,
            addMap: addMapFetcher
        }
        const fetcher = fetcherMap[step]
        if (fetcher) {
            const formData = new FormData()
            formData.append("actionType", `save${step.charAt(0).toUpperCase() + step.slice(1)}`)
            formData.append("remove", String(!check))
            fetcher.submit(formData, { method: "post" })
        }
    }

    useEffect(() => {
        setCount(
            [design, review, integrations, analytic, setting, pricing, addMap].filter(Boolean).length
        )
    }, [design, review, integrations, analytic, setting, pricing, addMap])

    const hasAddMapStep =
        Array.isArray(onBoard?.onBoarding) &&
        onBoard.onBoarding.includes("addMap")

    return (
        <s-page heading='Store Locator'>
            <s-query-container>
                <s-stack paddingInline="small" gap='base'>
                    <h2>Welcome to Store Locator</h2>
                    <s-stack>
                        {
                            embedStore ? (
                                <s-banner heading="Theme store app embeds are enabled." tone="info" dismissible>
                                    Embeds is enabled and ready to use.
                                </s-banner>
                            ) : (
                                <s-banner heading="Theme store app embeds are disabled." tone="warning" dismissible>
                                    <s-paragraph>Embedding is not enabled for your store yet. This feature must be activated before it can be used.</s-paragraph>
                                    <span style={{ color: "#0066CC" }}><s-link href={`https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=20d7d45fc96ed3baec84f8232a6cf110/store_locator`}>Go to embedding settings</s-link></span>
                                </s-banner>
                            )
                        }
                    </s-stack>

                    <s-stack>
                        <s-grid
                            gridTemplateColumns='@container (inline-size > 600px) 1fr 1fr, 1fr'
                            gap='base'
                        >
                            <s-section heading='Current Plan'>
                                <h1 style={{ marginBlock: 0 }}>{level.charAt(0).toUpperCase() + level.slice(1)}</h1>
                            </s-section>
                            <s-section heading='Location Limit'>
                                <h1 style={{ marginBlock: 0 }}>{locationLimit}</h1>
                            </s-section>
                            <s-section heading='Stores Visible'>
                                <h1 style={{ marginBlock: 0 }}>{visibleCount}</h1>
                            </s-section>
                            <s-section heading='Stores Hidden'>
                                <h1 style={{ marginBlock: 0 }}>{hiddenCount}</h1>
                            </s-section>
                        </s-grid>
                    </s-stack>

                    <s-section>
                        <s-stack gap="base">
                            <s-stack direction="inline" justifyContent="start" gap="base">
                                <s-stack>
                                    <s-icon type="incentive" />
                                </s-stack>
                                <s-stack>
                                    <h2 style={{ marginTop: "0", marginBottom: '8px' }}>Getting Started with Store Locator</h2>
                                    <s-paragraph>A step-by-step guide to configuring the app to suit your business needs.</s-paragraph>
                                </s-stack>
                            </s-stack>
                            <s-stack gap='small'>
                                <s-box>
                                    <s-text>{count} of 7 tasks completed </s-text>
                                </s-box>
                                <div style={{ width: "100%", background: "#E1E3E5", borderRadius: 4 }}>
                                    <div
                                        style={{
                                            width: `${(count / 7) * 100}%`,
                                            height: 8,
                                            background: "rgb(145, 208, 255)",
                                            borderRadius: 4,
                                            transition: "width 0.3s",
                                        }}
                                    />
                                </div>
                            </s-stack>

                            <s-stack gap='small'>

                                <s-clickable onClick={() => setIndex(1)} background={index === 1 ? 'subdued' : 'base'} borderRadius='large'>
                                    <DesignMap
                                        storeHandle={storeHandle}
                                        check={design}
                                        handleCheck={(val) => handleCheck("designMap", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(2)} background={index === 2 ? 'subdued' : 'base'} borderRadius='large'>
                                    <Review
                                        storeHandle={storeHandle}
                                        check={review}
                                        handleCheck={(val) => handleCheck("review", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(3)} background={index === 3 ? 'subdued' : 'base'} borderRadius='large'>
                                    <Integrations
                                        storeHandle={storeHandle}
                                        check={integrations}
                                        handleCheck={(val) => handleCheck("integrations", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(4)} background={index === 4 ? 'subdued' : 'base'} borderRadius='large'>
                                    <Analytic
                                        storeHandle={storeHandle}
                                        check={analytic}
                                        handleCheck={(val) => handleCheck("analytic", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(5)} background={index === 5 ? 'subdued' : 'base'} borderRadius='large'>
                                    <Setting
                                        storeHandle={storeHandle}
                                        check={setting}
                                        handleCheck={(val) => handleCheck("setting", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(6)} background={index === 6 ? 'subdued' : 'base'} borderRadius='large'>
                                    <Pricing
                                        storeHandle={storeHandle}
                                        check={pricing}
                                        handleCheck={(val) => handleCheck("pricing", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(7)} background={index === 7 ? 'subdued' : 'base'} borderRadius='large'>
                                    <AddMapToStore
                                        storeHandle={storeHandle}
                                        themeId={themeId}
                                        check={addMap}
                                        handleCheck={(val) => handleCheck("addMap", val)}
                                        index={index}
                                        hasAddMapStep={hasAddMapStep}
                                    />
                                </s-clickable>
                            </s-stack>
                        </s-stack>
                    </s-section>
                </s-stack>
            </s-query-container>

            <s-stack alignItems="center" paddingBlock="large-200">
                <s-text>
                    Learn more about <span style={{ color: 'blue' }}><s-link href="">Store Locator</s-link></span>
                </s-text>
            </s-stack>
        </s-page>
    )
}