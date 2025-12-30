import { useEffect, useState } from 'react'
import GoogleApi from 'app/component/onboarding/googleApi'
import DesignMap from 'app/component/onboarding/designMap'
import AddMapToStore from 'app/component/onboarding/addMapToStore'
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData } from 'react-router'
import { authenticate } from 'app/shopify.server'
import prisma from 'app/db.server'
import { hasStoreLocatorAddBlock } from 'app/utils/hasStoreBlock'
import Review from 'app/component/onboarding/review'
import Update from 'app/component/onboarding/update'
import { hasStoreLocatorEmbedEnabled } from 'app/utils/embedStore'

export async function loader({request}: LoaderFunctionArgs) {
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
        where: {shop}
    })

    return {storeHandle, themeId, onBoard}
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request)
    const shop = session.shop

    const formData = await request.formData()
    const actionType = formData.get("actionType") as string
    const remove = formData.get("remove") === "true"

    if (actionType === 'checkAddMap') {
        const hasBlock = await hasStoreLocatorAddBlock(admin, 'store-locator')
        const embedStore = await hasStoreLocatorEmbedEnabled(session, 'store-locator')
        const verified = hasBlock && embedStore

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

        return {ok: verified}
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

export default function Onboarding () {
    const [index, setIndex] = useState<number>(0)
    const [count, setCount] = useState(0)
    const {storeHandle, themeId, onBoard} = useLoaderData()
    const [googleMap, setGoogleMap] = useState(false)
    const [design, setDesign] = useState(false)
    const [review, setReview] = useState(false)
    const [update, setUpdate] = useState(false)
    const [addMap, setAddMap] = useState(false)

    const STEP_STATE_MAP: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {
        googleMap: setGoogleMap,
        designMap: setDesign,
        review: setReview,
        update: setUpdate,
        addMap: setAddMap,
    }

    useEffect(() => {
        if (!Array.isArray(onBoard?.onBoarding)) return

        onBoard.onBoarding.forEach((step: string) => {
            STEP_STATE_MAP[step]?.(true)
        })
    }, [onBoard])

    useEffect(() => {
        setCount(
            [googleMap, design, review, update, addMap].filter(Boolean).length
        )
    }, [googleMap, design, review, update, addMap])

    const hasAddMapStep =
        Array.isArray(onBoard?.onBoarding) &&
        onBoard.onBoarding.includes("addMap")

    
    return (
        <s-page heading='Store Locator'>
            <s-query-container>
                <s-stack paddingInline="small">
                    <h2>Welcome to Store Locator</h2>
                            
                    <s-stack background="base" padding="base" borderRadius="large" borderWidth="small" gap="base">
                        <s-stack direction="inline" justifyContent="start" gap="base">
                            <s-stack>
                                <s-icon type="incentive" />
                            </s-stack>
                            <s-stack>
                                <h2 style={{marginTop:"0", marginBottom:'8px'}}>Getting Started with Store Locator</h2>
                                <s-paragraph>A step-by-step guide to configuring the app to suit your business needs.</s-paragraph>
                            </s-stack>
                        </s-stack>
                        <s-stack gap='small'>
                            <s-box>
                                <s-text>{count} of 5 tasks completed </s-text>
                            </s-box>
                            <div style={{ width: "100%", background: "#E1E3E5", borderRadius: 4 }}>
                                <div
                                style={{
                                    width: `${(count/5) * 100}%`,
                                    height: 8,
                                    background: "rgb(145, 208, 255)",
                                    borderRadius: 4,
                                    transition: "width 0.3s",
                                }}
                                />
                            </div>
                        </s-stack>

                        <s-stack gap='small'>
                            <s-clickable onClick={() => setIndex(0)} background={index === 0 ? 'subdued' : 'base'} borderRadius='large'>
                                <GoogleApi 
                                    storeHandle = {storeHandle}
                                    check = {googleMap}
                                    handleCheck={setGoogleMap}
                                    index = {index}
                                />
                            </s-clickable> 

                            <s-clickable onClick={() => setIndex(1)} background={index === 1 ? 'subdued' : 'base'} borderRadius='large'>
                                 <DesignMap 
                                    storeHandle = {storeHandle}
                                    check = {design}
                                    handleCheck = {setDesign}
                                    index = {index}
                                />
                            </s-clickable>
                     
                            <s-clickable onClick={() => setIndex(2)} background={index === 2 ? 'subdued' : 'base'} borderRadius='large'>
                                 <Review 
                                    storeHandle = {storeHandle}
                                    check = {review}
                                    handleCheck = {setReview}
                                    index = {index}
                                />
                            </s-clickable>

                            <s-clickable onClick={() => setIndex(3)} background={index === 3 ? 'subdued' : 'base'} borderRadius='large'>
                                 <Update
                                    storeHandle = {storeHandle}
                                    check = {update}
                                    handleCheck = {setUpdate}
                                    index = {index}
                                />
                            </s-clickable>
                            
                            <s-clickable onClick={() => setIndex(4)} background={index === 4 ? 'subdued' : 'base'} borderRadius='large'>
                                <AddMapToStore 
                                    storeHandle = {storeHandle}
                                    themeId = {themeId}
                                    check = {addMap}
                                    handleCheck = {setAddMap}
                                    index = {index}
                                    hasAddMapStep = {hasAddMapStep}
                                />
                            </s-clickable>
                        </s-stack>
                    </s-stack>
                </s-stack>
            </s-query-container>
        </s-page>
    )
}