import { useFetcher } from "react-router"

export default function GoogleApi({
    storeHandle,
    check,
    handleCheck,
    index,
}: {
    storeHandle: string
    check: boolean,
    handleCheck: (value: boolean) => void
    index: number

}) {
    const fetcher = useFetcher()

    const handleToggle = (e: any) => {
        e.stopPropagation()

        const newCheck = !check
        handleCheck(newCheck)

        const formData = new FormData()
        formData.append('actionType', 'saveGoogleMap')
        formData.append('remove', String(!newCheck)) // nếu newCheck = false thì remove = true

        fetcher.submit(formData, { method: 'post' })
    }

    return (
        <s-stack padding="small" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-clickable onClick={handleToggle}>
                        {
                            check ?
                                <s-icon type="check-circle-filled" />
                                :
                                <s-icon type="circle-dashed" />
                        }
                    </s-clickable>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-heading>Google Maps</s-heading>
                    {
                        index === 0 &&
                        <>
                            <s-paragraph>This app requires a Google Maps API key to function properly. Once you have your API key, please enter it in the Google Maps section under the Integrations tab. For help setting up an API key, refer to the help article below.</s-paragraph>
                            <s-stack direction="inline">
                                <s-link href={`https://admin.shopify.com/store/${storeHandle}/apps/app-1972/app/settings`}>
                                    <s-button variant="primary" >Input API Key</s-button>
                                </s-link>
                            </s-stack>
                        </>
                    }
                </s-stack>
            </s-stack>

            {/* <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
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
                    <s-text type="strong">Manual Upload</s-text>
                    <s-paragraph>If you have a list of retailers that you would like to upload manually, download the CSV template by clicking the button below. After filling in the required fields, go to the All Locations tab, click Bulk Upload, and upload your completed file from there.</s-paragraph>
                    <s-stack direction="inline" justifyContent="start" gap="base">
                        <s-button onClick={() => handleExport()}>Bulk Upload Template</s-button>
                        <s-link href="/app/allLocation">
                            <s-button>All Locations</s-button>
                        </s-link>
                    </s-stack>
                </s-stack>
            </s-stack> */}
        </s-stack>
    )
}