
export default function Display () {
    return (
        <s-box inlineSize="100%">
            <s-query-container>
                <s-grid
                    gridTemplateColumns="@container (inline-size > 768px) 1fr 2fr, 1fr"
                    gap="base"
                >
                    <s-grid-item>
                        <h3>Change Language</h3>
                        <s-paragraph>Change the language of the app. Select the desired language from the dropdown list.</s-paragraph>
                    </s-grid-item>

                    <s-grid-item>
                        <s-stack background="base" padding="large-300" borderRadius="large" gap="small" borderWidth="base" >
                            <s-select label="Select Language" required>
                                <s-option>English</s-option>
                            </s-select>

                            <s-stack direction="inline" justifyContent="end" paddingBlockStart="small">
                                <s-button disabled>Save</s-button>
                            </s-stack>
                        </s-stack>
                    </s-grid-item>
                </s-grid>
            </s-query-container>
        </s-box>
    )
}