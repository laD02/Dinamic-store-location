import { useEffect, useState } from 'react'
import DesignMap from 'app/component/onboarding/designMap'
import AddMapToStore from 'app/component/onboarding/addMapToStore'
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData, useFetcher } from 'react-router'
import { authenticate } from 'app/shopify.server'
import prisma from 'app/db.server'
import Review from 'app/component/onboarding/review'
import Update from 'app/component/onboarding/update'
import { hasStoreLocatorEmbedEnabled } from 'app/utils/embedStore'

export async function loader({ request }: LoaderFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);

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

    const response = await admin.graphql(query);
    const data = await response.json();

    const mainTheme = data.data.themes.edges.find(
        (edge: any) => edge.node.role === "MAIN"
    );

    const themeGid = mainTheme.node.id;
    const themeId = themeGid.split("/").pop(); // số ID

    const shop = session.shop
    const storeHandle = session.shop.replace(".myshopify.com", "");

    const onBoard = await prisma.onBoard.findFirst({
        where: { shop }
    })

    const visibleCount = await prisma.store.count({
        where: { shop, visibility: "visible" }
    })

    const hiddenCount = await prisma.store.count({
        where: { shop, visibility: "hidden" }
    })

    const embedStore = await hasStoreLocatorEmbedEnabled(session, 'store-locator')

    return { storeHandle, themeId, onBoard, embedStore, visibleCount, hiddenCount }
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request)
    const shop = session.shop

    const formData = await request.formData()
    const actionType = formData.get("actionType") as string
    const remove = formData.get("remove") === "true"

    if (actionType === 'checkAddMap') {
        // const hasBlock = await hasStoreLocatorAddBlock(admin, 'store-locator')
        const embedStore = await hasStoreLocatorEmbedEnabled(session, 'store-locator')
        const verified = embedStore

        if (verified) {
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
        saveUpdate: "update",
        saveAddMap: "addMap",
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
    const { storeHandle, themeId, onBoard, embedStore, visibleCount, hiddenCount } = useLoaderData()

    const designFetcher = useFetcher()
    const reviewFetcher = useFetcher()
    const updateFetcher = useFetcher()
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
    const update = getOptimisticState("update", updateFetcher, false)
    const addMap = getOptimisticState("addMap", addMapFetcher, false)

    const handleCheck = (step: string, check: boolean) => {
        const fetcherMap: Record<string, any> = {
            designMap: designFetcher,
            review: reviewFetcher,
            update: updateFetcher,
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
            [design, review, update, addMap].filter(Boolean).length
        )
    }, [design, review, update, addMap])

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
                            gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr, 1fr'
                            gap='base'
                        >
                            <s-section heading='Stores Visible'>
                                {/* <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Stores Visible</h3> */}
                                <h1 style={{ marginBlock: 0 }}>{visibleCount}</h1>
                            </s-section>
                            <s-section heading='Stores Hidden'>
                                {/* <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Stores Hidden</h3> */}
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
                                    <s-text>{count} of 4 tasks completed </s-text>
                                </s-box>
                                <div style={{ width: "100%", background: "#E1E3E5", borderRadius: 4 }}>
                                    <div
                                        style={{
                                            width: `${(count / 4) * 100}%`,
                                            height: 8,
                                            background: "rgb(145, 208, 255)",
                                            borderRadius: 4,
                                            transition: "width 0.3s",
                                        }}
                                    />
                                </div>
                            </s-stack>

                            <s-stack gap='small'>
                                {/* <s-clickable onClick={() => setIndex(0)} background={index === 0 ? 'subdued' : 'base'} borderRadius='large'>
                                    <GoogleApi
                                        storeHandle={storeHandle}
                                        check={googleMap}
                                        handleCheck={setGoogleMap}
                                        index={index}
                                    />
                                </s-clickable> */}

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
                                    <Update
                                        storeHandle={storeHandle}
                                        check={update}
                                        handleCheck={(val) => handleCheck("update", val)}
                                        index={index}
                                    />
                                </s-clickable>

                                <s-clickable onClick={() => setIndex(4)} background={index === 4 ? 'subdued' : 'base'} borderRadius='large'>
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