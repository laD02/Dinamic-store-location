export default function ManageLocation () {
    return (
        <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Review Synced Locations</s-text>
                    <s-paragraph>In the All Locations table, review the data that has been synced through 3rd party integrations and hide certain locations or bulk update the tags for better search and filtering on your map.</s-paragraph>
                    <s-link href="/app/allLocation">
                        <s-button>View All Locations</s-button>
                    </s-link>
                </s-stack>
            </s-stack>

            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Update Individual Locations</s-text>
                    <s-paragraph>Click into individual locations to add to or update any imported or synced data to ensure your store locator is as accurate as possible, or review how a location will look on your live site.</s-paragraph>
                    <s-link href="/app/allLocation">
                        <s-button>View All Locations</s-button>
                    </s-link>
                </s-stack>
            </s-stack>
        </s-stack>
    )
}