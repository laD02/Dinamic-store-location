import { useFetcher } from "react-router"

export default function ManageLocation ({
    check1,
    check2,
    handleCheck1,
    handleCheck2
}: {
    check1: boolean
    check2: boolean
    handleCheck1: (value: boolean) => void
    handleCheck2: (value: boolean) => void
}) {
    const fetcher = useFetcher()

    const handleOnBoard1 = () => {
        const formData = new FormData()
        formData.append('saveReview', 'review')
        formData.append('actionType', 'saveReview')
        fetcher.submit(formData, {method: 'post'})
    }

    const handleOnBoard2 = () => {
        const formData = new FormData()
        formData.append('saveUpdate', 'update')
        formData.append('actionType', 'saveUpdate')
        fetcher.submit(formData, {method: 'post'})
    }
  
    return (
        <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-clickable onClick={() => handleCheck1(!check1)}>
                        {
                            check1 ?
                            <s-icon type="check-circle-filled"/>
                            :
                            <s-icon type="circle-dashed"/>
                        }               
                    </s-clickable>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Review Synced Locations</s-text>
                    <s-paragraph>In the All Locations table, you can review data synced from third-party integrations, hide specific locations, and bulk update tags to improve search and filtering on your map.</s-paragraph>
                    <s-stack direction="inline">
                        <s-link href="/app/allLocation">
                            <s-button onClick={() => handleOnBoard1()}>View All Locations</s-button>
                        </s-link>
                    </s-stack>
                </s-stack>
            </s-stack>

            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-clickable onClick={() => handleCheck2(!check2)}>
                        {
                            check2 ?
                            <s-icon type="check-circle-filled"/>
                            :
                            <s-icon type="circle-dashed"/>
                        }               
                    </s-clickable>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Update Individual Locations</s-text>
                    <s-paragraph>Click on individual locations to add or update imported or synced data, ensuring your store locator remains accurate. You can also preview how each location will appear on your live site.</s-paragraph>
                    <s-stack direction="inline">
                        <s-link href="/app/allLocation">
                            <s-button onClick={() => handleOnBoard2()}>View All Locations</s-button>
                        </s-link>
                    </s-stack>
                </s-stack>
            </s-stack>
        </s-stack>
    )
}