
export default function Review({
    storeHandle,
    check,
    handleCheck,
    index
}: {
    storeHandle: string
    check: boolean
    handleCheck: (value: boolean) => void
    index: number
}) {
    // const fetcher = useFetcher()

    const handleToggle = (e: any) => {
        e.stopPropagation()

        handleCheck(!check)
    }

    return (
        <s-stack padding="small" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-clickable onClick={handleToggle}>
                        {
                            check ?
                                <>
                                    <s-icon type="check-circle-filled" interestFor="review" />
                                    <s-tooltip id="review" >Done</s-tooltip>
                                </>
                                :
                                <s-icon type="circle-dashed" />
                        }
                    </s-clickable>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-heading>Shopify B2B (Business Plus Plans Only)</s-heading>
                    {
                        index === 4 &&
                        <>
                            <s-paragraph>If Shopify B2B is enabled on your store (or on an expansion store), you can automatically import Company Locations to display on your map. Go to the Integrations tab to sync your Shopify B2B companies with the map. If you're using B2B on an expansion store, make sure to generate an API key in that expansion store first before syncing.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/apps/app-1972/app/integrations`}>
                                    <s-button variant="primary">Go to Integrations</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>
        </s-stack>
    )
}