
export default function Setting({
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
                                    <s-icon type="check-circle-filled" interestFor="setting-done" />
                                    <s-tooltip id="setting-done">Done</s-tooltip>
                                </>
                                :
                                <s-icon type="circle-dashed" />
                        }
                    </s-clickable>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-heading>Configure Notification Settings</s-heading>
                    {
                        index === 5 &&
                        <>
                            <s-paragraph>Stay updated with your store's performance. Configure how and when you receive automated analytics reports in your notification center.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/apps/app-1972/app/settings`}>
                                    <s-button variant="primary">Go to Settings</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>
        </s-stack>
    )
}
