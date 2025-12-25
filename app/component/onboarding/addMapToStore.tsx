import { useAppBridge } from "@shopify/app-bridge-react"
import { useEffect } from "react"
import { useFetcher } from "react-router"

export default function AddMapToStore ({
    storeHandle,
    themeId,
    check,
    handleCheck,
    index
}: {
    storeHandle: string
    themeId: string
    check: boolean
    handleCheck: (value:boolean) => void
    index: number
}) {
    const fetcher = useFetcher()
    const toggleFetcher = useFetcher()
    const shopify = useAppBridge()
    
    const handleOnBoard = () => {
        const formData = new FormData()
        formData.append('actionType', 'saveAddMap')
        fetcher.submit(formData, {method: 'post'})
    }

    const handleToggle = () => {
        const newCheck = !check
        handleCheck(newCheck)

        const formData = new FormData()
        formData.append('actionType', 'saveAddMap')
        formData.append('remove', 'true')
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
                    <s-clickable onClick={() => handleToggle()}>
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
                            <s-paragraph>You can add your map to your store using the Shopify theme editor. Go to Online Store, click Customize next to the theme where you want to display the map, then select Add Section and choose the Store Locator app from the app options.</s-paragraph>
                            <s-stack direction="inline" gap="base">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/themes/${themeId}/editor?context=apps&activateAppId=20d7d45fc96ed3baec84f8232a6cf110/store_locator`}>
                                    <s-button>Open Shopify CMS</s-button>
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