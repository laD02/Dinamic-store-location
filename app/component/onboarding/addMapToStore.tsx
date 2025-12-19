
export default function AddMapToStore ({themeEditorUrl}: {themeEditorUrl: string}) {
    return (
        <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Install the Map Using App Blocks</s-text>
                    <s-paragraph>You can add your map to your store using the Shopify theme editor. Go to Online Store, click Customize next to the theme where you want to display the map, then select Add Section and choose the Store Locator app from the app options.</s-paragraph>
                    <s-link href={themeEditorUrl} target="_top">
                        <s-button>Open Shopify CMS</s-button>
                    </s-link>
                </s-stack>
            </s-stack>
        </s-stack>
    )
}