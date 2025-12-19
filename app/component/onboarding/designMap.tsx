export default function DesignMap () {
    return (
        <s-stack padding="base" gap="base">
            <s-stack direction="inline" justifyContent="start" alignItems="start" gap="small">
                <s-stack>
                    <s-icon type="circle-dashed"/>
                </s-stack>
                <s-stack gap="small" inlineSize="92%">
                    <s-text type="strong">Select Map Design Options</s-text>
                    <s-paragraph>In the Map Designer tab, you can customize your primary map colors and fonts, as well as set the map size and default load location. You can also define a universal map marker and style the location popups, making it easy to create a cohesive and consistent map design across all locations.</s-paragraph>
                    <s-link href="/app/map-designers">
                        <s-button>Go to Map Designer</s-button>
                    </s-link>
                </s-stack>
            </s-stack>
        </s-stack>
    )
}