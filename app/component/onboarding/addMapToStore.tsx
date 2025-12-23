import { useAppBridge } from "@shopify/app-bridge-react"
import { useEffect } from "react"
import { useFetcher } from "react-router"

export default function AddMapToStore ({
    themeEditorUrl,
    check,
    handleCheck,
}: {
    themeEditorUrl: string
    check: boolean
    handleCheck: (value:boolean) => void
}) {
    const fetcher = useFetcher()
    const shopify = useAppBridge()
    
    const handleOnBoard = () => {
        const formData = new FormData()
        formData.append('saveAddMap', 'addMap')
        formData.append('actionType', 'saveAddMap')
        fetcher.submit(formData, {method: 'post'})
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
        <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-clickable onClick={() => handleCheck(!check)}>
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
                    <s-paragraph>You can add your map to your store using the Shopify theme editor. Go to Online Store, click Customize next to the theme where you want to display the map, then select Add Section and choose the Store Locator app from the app options.</s-paragraph>
                    <s-stack direction="inline" gap="base">
                        <s-link href={themeEditorUrl}>
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
                </s-stack>
            </s-stack>
        </s-stack>
    )
}