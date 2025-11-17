
import { useNavigate } from "react-router"
import styles from "../css/shopifyB2B.module.css"
import { useState } from "react"

export default function ShopifyB2B () {
    const navigate = useNavigate()
    const [value, setValue] = useState("")

    return (
        <s-stack inlineSize="100%" gap="large">
            <s-stack background="base" padding="base" borderRadius="large" inlineSize="100%" gap="small" borderWidth="base">
                <h2>Shopify B2B</h2>
                <s-paragraph>Automatically display and update information for your Shopify B2B customers on your map. You must have a Shopify Plus account with active Company listings in order for this integration to work correctly.</s-paragraph>
                <div className={styles.upgrade}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <div className={styles.contentUpgrade}>
                        <h5>Upgrade Required</h5>
                        <p>Shopify B2B Integration feature is only available on the Business Plus plan. Upgrade your plan to access this feature.</p>
                        <div>    
                            <s-button onClick={ () => navigate("/app/plan")}>Upgrade My Plan</s-button>
                        </div>
                    </div>
                </div>
                <h4 style={{marginTop:"16px"}}>Shopify B2B Account</h4>
                <s-stack>
                    <s-choice-list
                        name="account"
                        onChange={e => {
                            const target = e.currentTarget.values
                            setValue(target ? target[0] : "")
                        }}
                    >
                        <s-choice value="1">My retailers are in this Shopify account, and I want them to display on the Retail Locator on this store.</s-choice>
                        <s-choice value="2">My retailers are in another Shopify account, and I want them to display on the Retailer Locator on this store.</s-choice>
                    </s-choice-list>

                    {
                        value === "2" && 
                        <s-stack gap="small" paddingBlockStart="small">
                            <s-url-field 
                                label="Shopify B2B Store"
                                placeholder="https://your-store.myshopify.com"
                                details="URL must be in the format: https://store.myshopify.com"
                            />
                            <s-url-field 
                                label="Shopify B2B Store URL"
                                placeholder="Enter Shopify B2B API Key"
                            />

                            <s-banner 
                                heading="Shopify B2B Integration feature is only available on the Business Plus plan. Upgrade your plan to access this feature."
                                tone="warning"
                            >
                            </s-banner>

                            <s-button>Save Connection</s-button>
                        </s-stack>
                    }
                </s-stack>
            </s-stack>

            <s-banner heading="If you just loaded the app in order to connect this store with your Retail Locator, please see instructions below.">
                <s-stack gap="small">
                    <s-text><s-link>Click here</s-link> to display your individualized API key below, then copy it over into your other store.</s-text>
                    <s-text type="strong">Connect Your B2B Store With Another Store</s-text>
                    <s-text-field 
                        label="API Key"
                        placeholder="No access token available"
                    />
                </s-stack>
            </s-banner>

        </s-stack>
    )
}