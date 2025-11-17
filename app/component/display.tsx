import styles from "../css/display.module.css"

export default function Display () {
    return (
        <s-stack direction="inline"justifyContent="space-between" >
            <s-stack inlineSize="34%">
                <h3>Change Language</h3>
                <s-paragraph>Change the language of the app. Select the desired language from the dropdown list.</s-paragraph>
            </s-stack>

            <s-stack background="base" padding="large-300" borderRadius="large" inlineSize="65%" gap="small" borderWidth="base" >
                <s-select label="Select Language" required>
                    <s-option>English</s-option>
                </s-select>

                <s-stack direction="inline" justifyContent="end" paddingBlockStart="small">
                    <s-button disabled>Save</s-button>
                </s-stack>
            </s-stack>
        </s-stack>
    )
}