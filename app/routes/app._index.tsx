import { useEffect, useState } from 'react'
import GoogleApi from 'app/component/onboarding/googleApi'
import DesignMap from 'app/component/onboarding/designMap'
import AddMapToStore from 'app/component/onboarding/addMapToStore'
import { ActionFunctionArgs, LoaderFunctionArgs, useLoaderData } from 'react-router'
import { authenticate } from 'app/shopify.server'
import prisma from 'app/db.server'
import { hasStoreLocatorBlock } from 'app/utils/hasStoreBlock'
import Review from 'app/component/onboarding/review'
import Update from 'app/component/onboarding/update'

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

    const themeEditorUrl = `https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor`;
    const onBoard = await prisma.onBoard.findFirst({
        where: {shop}
    })

    return {themeEditorUrl, onBoard}
}

export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request)
    const shop = session.shop

    const formData = await request.formData()
    const actionType = formData.get("actionType") as string

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

    // 👉 RIÊNG STEP addMap → phải verify theme
    if (step === "addMap") {
        const hasBlock = await hasStoreLocatorBlock(admin, 'store-locator')

        if (!hasBlock) {
            return {
                ok: false
            }
        }
    }

    // Lấy trạng thái hiện tại
    const existing = await prisma.onBoard.findFirst({
        where: { shop },
    })

    const current = Array.isArray(existing?.onBoarding)
        ? existing.onBoarding
        : []

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
    const {themeEditorUrl, onBoard} = useLoaderData()
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
                        <s-stack direction='inline' gap='small-200' alignItems='center'>
                            <s-paragraph>{count} of 5 tasks completed </s-paragraph>
                            <s-box>
                                {count === 5 && <s-icon type='check' size='small'/>}
                            </s-box>
                            <div style={{ width: "100%", background: "#E1E3E5", borderRadius: 4 }}>
                                <div
                                style={{
                                    width: `${(count/5) * 100}%`,
                                    height: 4,
                                    background: "#2790dbff",
                                    borderRadius: 4,
                                    transition: "width 0.3s",
                                }}
                                />
                            </div>
                        </s-stack>

                        <s-stack gap='small'>
                            <s-clickable onClick={() => setIndex(0)} background={index === 0 ? 'subdued' : 'base'} borderRadius='large'>
                                <GoogleApi 
                                    check = {googleMap}
                                    handleCheck={setGoogleMap}
                                    index = {index}
                                />
                            </s-clickable> 

                            <s-clickable onClick={() => setIndex(1)} background={index === 1 ? 'subdued' : 'base'} borderRadius='large'>
                                 <DesignMap 
                                    check = {design}
                                    handleCheck = {setDesign}
                                    index = {index}
                                />
                            </s-clickable>
                     
                            <s-clickable onClick={() => setIndex(2)} background={index === 2 ? 'subdued' : 'base'} borderRadius='large'>
                                 <Review 
                                    check = {review}
                                    handleCheck = {setReview}
                                    index = {index}
                                />
                            </s-clickable>

                            <s-clickable onClick={() => setIndex(3)} background={index === 3 ? 'subdued' : 'base'} borderRadius='large'>
                                 <Update
                                    check = {update}
                                    handleCheck = {setUpdate}
                                    index = {index}
                                />
                            </s-clickable>
                            
                            <s-clickable onClick={() => setIndex(4)} background={index === 4 ? 'subdued' : 'base'} borderRadius='large'>
                                <AddMapToStore 
                                    themeEditorUrl={themeEditorUrl}
                                    check = {addMap}
                                    handleCheck = {setAddMap}
                                    index = {index}
                                />
                            </s-clickable>
                        </s-stack>
                    </s-stack>
                </s-stack>
            </s-query-container>
        </s-page>
    )
}