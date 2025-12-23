import { useFetcher } from "react-router"

export default function Update ({
    check,
    handleCheck,
    index
}: {
    check: boolean
    handleCheck: (value: boolean) => void
    index: number
}) {
    const fetcher = useFetcher()

    const handleOnBoard = () => {
        const formData = new FormData()
        formData.append('saveUpdate', 'update')
        formData.append('actionType', 'saveUpdate')
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
                    <s-text type="strong">Update Individual Locations</s-text>
                    {
                        index === 3 &&
                        <>
                            <s-paragraph>Click on individual locations to add or update imported or synced data, ensuring your store locator remains accurate. You can also preview how each location will appear on your live site.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href="/app/allLocation">
                                    <s-button onClick={() => handleOnBoard()}>View All Locations</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>
        </s-stack>
    )
}