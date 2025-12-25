import { useFetcher } from "react-router"

export default function DesignMap ({
    storeHandle,
    check,
    handleCheck,
    index
}: {
    storeHandle: string
    check: boolean
    handleCheck: ( value: boolean) => void
    index: number
}) {
    const fetcher = useFetcher()

    const handleOnBoard = () => {
        const formData = new FormData()
        formData.append('actionType', 'saveDesignMap')
        fetcher.submit(formData, {method: 'post'})
    }

    const handleToggle = () => {
        const newCkeck = !check
        handleCheck(newCkeck)

        const formData = new FormData()
        formData.append("actionType", "saveDesignMap")
        formData.append("remove", "true")
        fetcher.submit(formData, {method: 'post'})
    }

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
                    <s-text type="strong">Select Map Design Options</s-text>
                    {
                        index === 1 && 
                        <>
                             <s-paragraph>In the Map Designer tab, you can customize your primary map colors and fonts, as well as set the map size and default load location. You can also define a universal map marker and style the location popups, making it easy to create a cohesive and consistent map design across all locations.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/apps/app-1972/app/map-designers`}>
                                    <s-button variant="primary" onClick={() => handleOnBoard()}>Go to Map Designer</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    } 
                </s-stack>
            </s-stack>
        </s-stack>
    )
}