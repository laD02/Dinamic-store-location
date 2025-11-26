
import { useFetcher, useLoaderData, useNavigate } from "react-router"
import styles from "../css/shopifyB2B.module.css"
import { useEffect, useState } from "react"
import { useAppBridge } from "@shopify/app-bridge-react"

export default function ShopifyB2B () {
    const {apiKey} = useLoaderData()
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const shopify = useAppBridge()
    const [value, setValue] = useState("")
    const [url, setUrl] = useState('')
    const [b2b, setB2B] = useState('')
    const [errorUrl, setErrorUrl] = useState(false)
    const [errorB2B, setErrorB2B] = useState(false)
    const [showValue, setShowValue] = useState(false)

    useEffect(() => {
        if (fetcher.data?.ok) {
            shopify.toast.show("The settings have been updated.");

            // Reset UI
            setValue("");
            setUrl("");
            setB2B("");
            setErrorUrl(false);
            setErrorB2B(false);
        }
    }, [fetcher.data, shopify]);


    const handleChangeUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value
        setUrl(url)

        if (url.trim()) {
            setErrorUrl(false)
        }
    }

    const handleChangeB2B = (e: React.ChangeEvent<HTMLInputElement>) => {
        const b2b = e.target.value
        setB2B(b2b)

        if (b2b.trim()) {
            setErrorB2B(false)
        }
    }

    const handleSubmit = () => {
        const regex = /^https:\/\/[a-z0-9-]+\.myshopify\.com$/i;

        if (!regex.test(url)) {
            setErrorUrl(true)
            return
        } else {
            if (!b2b.trim()) {
                setErrorUrl(false)
                setErrorB2B(true)
                return
            } else {
                setErrorB2B(false)
                setErrorUrl(false)
            }
        }

        const formData = new FormData()
        const save = {url, b2b}
        formData.append('save', JSON.stringify(save))
        formData.append('actionType', 'save')
        fetcher.submit(formData, {method: 'post'})
        // setValue('')
    }

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
                        values={value ? [value] : []}
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
                                label="Shopify B2B Store URL"
                                placeholder="https://your-store.myshopify.com"
                                details="URL must be in the format: https://store.myshopify.com"
                                onInput={(e: any) => handleChangeUrl(e)}
                            />
                            <s-password-field
                                label="Shopify B2B API Key"
                                placeholder="Enter Shopify B2B API Key"
                                onInput={(e: any) => handleChangeB2B(e)}
                            />

                            <s-banner 
                                heading="Shopify B2B Integration feature is only available on the Business Plus plan. Upgrade your plan to access this feature."
                                tone="warning"
                            >
                            </s-banner>

                            <s-button 
                                onClick={() => handleSubmit()}
                            >
                                Save Connection
                            </s-button>
                            {/* <s-modal id="info-modal" heading="Shopify B2B Integration Enabled">
                                <s-text>                                   
                                    The Shopify B2B integration has been enabled. Companies who have ordered in the last 30 days will be automatically synced to your map as long as they have a public address for their brick-and-mortar store listed with Google. Depending on how many retailers you have, it may take some time to fully sync. Please go to the All Locations tab, and filter by 'Shopify B2B' to ensure your locations are being added properly.
                                </s-text>

                                <s-button variant="primary" slot="secondary-actions" commandFor="info-modal" command="--hide">
                                    Ok
                                </s-button>
                            </s-modal> */}
                            {
                                errorUrl &&
                                <s-banner heading="Validation Error" tone="critical">
                                    <s-text>Please enter the Shopify B2B store URL. It should be in the format: https://store.myshopify.com</s-text>
                                </s-banner>
                            }
                            {
                                errorB2B && 
                                <s-banner heading="Validation Error" tone="critical">
                                    <s-text>Please enter the Shopify B2B API key.</s-text>
                                </s-banner>
                            }
                        </s-stack>
                    }
                </s-stack>
            </s-stack>

            <s-banner heading="If you just loaded the app in order to connect this store with your Retail Locator, please see instructions below.">
                <s-stack gap="small">
                    <s-text><s-link onClick={() => setShowValue(true)}>Click here</s-link> to display your individualized API key below, then copy it over into your other store.</s-text>
                    <s-text type="strong">Connect Your B2B Store With Another Store</s-text>
                    <s-text-field 
                        label="API Key"
                        placeholder="No access token available"
                        value={showValue ? apiKey : ''}
                    />
                </s-stack>
            </s-banner>
        </s-stack>
    )
}