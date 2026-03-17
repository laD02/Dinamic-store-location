
export default function Analytic({
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
                    <s-heading>Store Interaction Analytics</s-heading>
                    {
                        index === 4 &&
                        <>
                            <s-paragraph>This dashboard provides a comprehensive overview of how customers interact with your store locations. Track store views, searches, direction requests, website visits, and phone clicks to understand customer intent and optimize your store performance.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/apps/app-1972/app/analytics`}>
                                    <s-button variant="primary">Go to Analytics</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>
        </s-stack>
    )
}