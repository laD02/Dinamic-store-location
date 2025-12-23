import { useFetcher } from "react-router"

export default function Review ({
    check,
    handleCheck,
    index
}: {
    check: boolean
    handleCheck: (value: boolean) => void
    index: number
}) {
    const fetcher = useFetcher()

    const handleOnBoard1 = () => {
        const formData = new FormData()
        formData.append('saveReview', 'review')
        formData.append('actionType', 'saveReview')
        fetcher.submit(formData, {method: 'post'})
    }

  
    return (
        <s-stack padding="small" gap="base">
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
                    <s-text type="strong">Review Synced Locations</s-text>
                    {
                        index === 2 &&
                        <>
                            <s-paragraph>In the All Locations table, you can review data synced from third-party integrations, hide specific locations, and bulk update tags to improve search and filtering on your map.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href="/app/allLocation">
                                    <s-button onClick={() => handleOnBoard1()}>View All Locations</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>
        </s-stack>
    )
}