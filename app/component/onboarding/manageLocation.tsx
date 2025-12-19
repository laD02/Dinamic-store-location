export default function ManageLocation () {
    return (
        <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Review Synced Locations</s-text>
                    <s-paragraph>In the All Locations table, you can review data synced from third-party integrations, hide specific locations, and bulk update tags to improve search and filtering on your map.</s-paragraph>
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
                    <s-paragraph>Click on individual locations to add or update imported or synced data, ensuring your store locator remains accurate. You can also preview how each location will appear on your live site.</s-paragraph>
                    <s-link href="/app/allLocation">
                        <s-button>View All Locations</s-button>
                    </s-link>
                </s-stack>
            </s-stack>
        </s-stack>
    )
}