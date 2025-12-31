import { useAppBridge } from "@shopify/app-bridge-react"
import { useEffect } from "react"
import { useFetcher } from "react-router"

export default function AddMapToStore ({
    storeHandle,
    themeId,
    check,
    handleCheck,
    index,
    hasAddMapStep
}: {
    storeHandle: string
    themeId: string
    check: boolean
    handleCheck: (value:boolean) => void
    index: number
    hasAddMapStep: boolean
}) {
    const fetcher = useFetcher()
    const toggleFetcher = useFetcher()
    const shopify = useAppBridge()
    
    const handleOnBoard = () => {
        const formData = new FormData()
        formData.append('actionType', 'checkAddMap')
        fetcher.submit(formData, {method: 'post'})
    }

    const handleToggle = (e: any) => {
        e.stopPropagation()

        const newCheck = !check
        handleCheck(newCheck)

        const formData = new FormData()
        formData.append('actionType', 'saveAddMap')
        formData.append('remove', String(!newCheck))
        toggleFetcher.submit(formData, {method: 'post'})
    }

    useEffect(() => {
        if (!fetcher.data) return
        if (fetcher.data?.ok) {
            shopify.toast.show('Store Locator Embed is enabled.')
        } else {
            shopify.toast.show('Store Locator Embed is disabled.')
        }
    }, [fetcher.data])

    return (
        <s-stack padding="small" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-clickable onClick={handleToggle}>
                        {
                            check ?
                            <s-icon type="check-circle-filled"/>
                            :
                            <s-icon type="circle-dashed"/>
                        }               
                    </s-clickable>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Install the Map Using App Blocks</s-text>
                    {
                        index === 4 && 
                        <>
                            <s-paragraph>Enable the Store Locator core in your theme by clicking “Open Shopify CMS” and “Save”. Once activated, open Online Store → Customize, add a new section, and select Store Locator to display the map on your store.</s-paragraph>
                            <s-stack direction="inline" gap="base">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=20d7d45fc96ed3baec84f8232a6cf110/store_locator`}>
                                    <s-button disabled={hasAddMapStep} variant="primary">Open Shopify CMS</s-button>
                                </s-link>
                                <s-button 
                                    onClick={() => handleOnBoard()}
                                    loading={fetcher.state !== "idle"}
                                    disabled={fetcher.state !== "idle"}
                                >
                                    Check
                                </s-button>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>
        </s-stack>
    )
}