

export default function Installation () {

    return (
        <s-page heading="Dynamic Store Locator">
            <h2>Installation</h2>
            <s-stack gap="large">
                <s-stack direction="inline" justifyContent="space-between">
                    <s-stack gap="small" inlineSize="34%">
                        <s-box>Option 1:</s-box>
                        <s-box>
                            <s-text type="strong">
                                How to Add the App Block
                            </s-text>
                        </s-box>
                        <s-paragraph>Recommended installation method. Your store must be using Shopify 2.0 to utilize this method.</s-paragraph>
                    </s-stack>

                    <s-stack inlineSize="62%" background="base" padding="large-300" borderRadius="large" gap="small" borderWidth="base">
                        <s-stack direction="inline" justifyContent="space-between">
                            <s-stack gap="small">
                                <s-box>Step 1</s-box>
                                <s-box>
                                    <s-text type="strong">Open the Shopify CMS</s-text>
                                </s-box>
                            </s-stack>

                            <s-box inlineSize="64%">
                                In your Shopify account, click ‘Online Store’ on the left side, and then click ‘Customize’ next to the theme where you want to install the map    
                            </s-box>
                        </s-stack>               
                        <s-divider />
                        <s-stack direction="inline" justifyContent="space-between">
                            <s-stack gap="small" inlineSize="36%">
                                <s-box>Step 2</s-box>
                                <s-box>
                                    <s-text type="strong">Find the Page Where You Want to Install the Store Locator</s-text>
                                </s-box>
                            </s-stack>

                            <s-box inlineSize="64%">
                                In the top bar, click the drop down and go to 'Pages' and find the page where you want to install the locator. If you want to install it on a new page, you'll need to first create the page in your Shopify Admin under 'Pages'. 
                            </s-box>
                        </s-stack>               
                        <s-divider />
                        <s-stack direction="inline" justifyContent="space-between">
                            <s-stack gap="small">
                                <s-box>Step 3</s-box>
                                <s-box>
                                    <s-text type="strong">Add a New Section</s-text>
                                </s-box>
                            </s-stack>

                            <s-box inlineSize="64%">
                                Click 'Add Section' on the left side of the CMS tool bar and toggle to the Apps'. Find the 'H1 Dynamic Store Locator' app and click it to add it to the page. 
                            </s-box>
                        </s-stack>               
                        <s-divider />
                        <s-stack direction="inline" justifyContent="space-between">
                            <s-stack gap="small">
                                <s-box>Step 4</s-box>
                                <s-box>
                                    <s-text type="strong">Place Your Map</s-text>
                                </s-box>
                            </s-stack>

                            <s-box inlineSize="64%">
                                After that, you can drag and drop your map anywhere on the page, or add in headings and content above or below it.
                            </s-box>
                        </s-stack>               
                    </s-stack>
                </s-stack>

                <s-stack direction="inline" justifyContent="space-between">
                    <s-stack gap="small" inlineSize="34%">
                        <s-box>Option 2:</s-box>
                        <s-box>
                            <s-text type="strong">
                                HTML Embed
                            </s-text>
                        </s-box>
                        <s-paragraph>Copy and paste the code snippet into an HTML block of the page where you wish the store locator to be visible.</s-paragraph>
                    </s-stack>
            
                    <s-stack direction="inline" justifyContent="space-between" inlineSize="62%" background="base" padding="large-300" borderRadius="large" gap="small" borderWidth="base">
                        <s-stack gap="small">
                            <s-box>Step 1</s-box>
                            <s-box>
                                <s-text type="strong">Copy the Embed Code</s-text>
                            </s-box>
                        </s-stack>

                        <s-box inlineSize="64%">
                            Copy and paste the code snippet below into an HTML block of the page where you wish the store locator to be visible.    
                        </s-box>
                    </s-stack>    
                </s-stack>
            </s-stack>
            <s-stack alignItems="center" paddingBlock="base">
                <s-text>
                    ©2025
                    <s-link href="https://www.h1-apps.com/"> H1 Web Development.  </s-link>
                    All Rights Reserved.
                </s-text>
            </s-stack>
        </s-page>
    )
}