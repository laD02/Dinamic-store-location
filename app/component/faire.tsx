
export default function Faire () {
    return (
        <s-stack inlineSize="100%" gap="large">
            <s-stack background="base" padding="base" borderRadius="large" inlineSize="100%" gap="small" borderWidth="base">
                <h2>Faire</h2>
                <s-paragraph>Automatically diss-paragraphlay and update the information for your Faire retailers on your map. The last 6 months of orders will be automatically synced after authentication. For ongoing updates, you can choose to initiate manual syncs or automatically sync every 24 hours using the settings below.</s-paragraph>
                <s-box inlineSize="100%" >
                    <s-button tone="critical" >Faire Account Login</s-button>
                </s-box>
            </s-stack>

            <s-banner heading="How does the Faire Integration work?">
                Only Faire retailers that have a publicly available brick-and-mortar address on Google will be pulled into your Dynamic Store Locator account. If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list.
            </s-banner>
        </s-stack>
    )
}