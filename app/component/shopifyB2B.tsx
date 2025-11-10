
import { useNavigate } from "react-router"
import styles from "../css/shopifyB2B.module.css"
import { useState } from "react"

export default function ShopifyB2B () {
    const navigate = useNavigate()
    const [value, setValue] = useState("")

    return (
        <div className={styles.wrapper}>
            <div className={styles.boxShopifyB2B}>
                <h2>Shopify B2B</h2>
                <p>Automatically display and update information for your Shopify B2B customers on your map. You must have a Shopify Plus account with active Company listings in order for this integration to work correctly.</p>
                <div className={styles.upgrade}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <div className={styles.contentUpgrade}>
                        <h5>Upgrade Required</h5>
                        <p>Shopify B2B Integration feature is only available on the Business Plus plan. Upgrade your plan to access this feature.</p>
                        <div>    
                            <button onClick={ () => navigate("/app/plan")}>Upgrade My Plan</button>
                        </div>
                    </div>
                </div>
                <h4 style={{marginTop:"16px"}}>Shopify B2B Account</h4>
                <div className={styles.boxRadio}>
                    <div>
                        <input 
                            type="radio"
                            name= "account"
                            value="1"
                            checked= {value === "1"}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        <label>
                            My retailers are in this Shopify account, and I want them to display on the Retail Locator on this store.
                        </label>
                    </div>
                    <div>
                        <input 
                            type="radio"
                            name="account"
                            value="2"
                            checked= {value === "2"}
                            onChange={(e) => setValue(e.target.value)}
                        />
                        <label>
                            My retailers are in another Shopify account, and I want them to display on the Retailer Locator on this store.
                        </label>
                    </div>

                    {
                        value === "2" && 
                        <div className={styles.shopifyStore}>
                            <h3>Shopify B2B Store</h3>
                            <div className={styles.storeUrl}>
                                <h4>Shopify B2B Store URL</h4>
                                <i className="fa-regular fa-circle-question"></i>
                            </div>
                            <input 
                                className={styles.inputUrl} 
                                type="text" 
                                placeholder="https://your-store.myshopify.com"
                            />
                            <span className={styles.urlText}>URL must be in the format: https://store.myshopify.com</span>
            
                            <div className={styles.storeUrl}>
                                <h4>Shopify B2B Store URL</h4>
                                <i className="fa-regular fa-circle-question"></i>
                            </div>
                            <input 
                                className={styles.inputUrl} 
                                type="text" 
                                placeholder="Enter Shopify B2B API Key"
                            />

                            <div className={styles.warning}>
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                <div className={styles.contentUpgrade}>
                                    <span className={styles.text}>Shopify B2B Integration feature is only available on the Business Plus plan. Upgrade your plan to access this feature.</span>
                                </div>
                            </div>

                            <button className={styles.saveCnt}>Save Connection</button>
                        </div>
                    }
                </div>
            </div>

            <div className={styles.needHelp}>
                <div className={styles.title}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>If you just loaded the app in order to connect this store with your Retail Locator, please see instructions below.</span>
                </div>
                <div className={styles.content}>
                    <p><a href="">Click here</a> to display your individualized API key below, then copy it over into your other store.</p>
                </div>
                <h4 className={styles.mgl16}>Connect Your B2B Store With Another Store</h4>
                <div className={styles.api}>
                    <label>API Key</label>
                    <input 
                        type="text"
                        placeholder="No access token available"
                    />
                </div>
            </div>

        </div>
    )
}