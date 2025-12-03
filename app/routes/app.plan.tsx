import { Link, useNavigate } from "react-router"
import styles from "../css/plan.module.css"

export default function Plan () {
    const navigate = useNavigate()

    return (
        <div className={styles.wrapper}>
            <h3>
                <i className="fa-solid fa-arrow-left" onClick={() => navigate(-1)}></i>
                Select a plan
            </h3>
            <s-stack direction="inline" justifyContent="space-between">
                <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="30%">
                    <div className={styles.title}>Basic</div>
                    <div className={styles.pricing}>Free</div>
                    <div className={styles.info}></div>
                    {/* <s-box blockSize="10%"></s-box> */}
                    <div>
                        <s-link href='/app/charges/basic'>
                            <s-button variant="primary">Select</s-button>
                        </s-link>
                    </div>
                    <div className={styles.list}>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Up to 10 Locations
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Custom Search Filters
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Google Maps Integration
                        </span>
                    </div>
                </s-stack>
                <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="30%">
                    <div className={styles.title}>Advanced</div>
                    <div className={styles.pricing}>$30 <span>/ 30 days</span></div>
                    <div className={styles.info}>3 trial days remaining</div>
                    <div>
                        <s-link href='/app/charges/advanced'>
                            <s-button variant="primary" >Select</s-button>
                        </s-link>
                    </div>
                    <div className={styles.list}>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Up to 1,500 Locations
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Faire Integration
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Bulk/CSV Import & Export
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Custom Search Filters
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Google Maps Integration
                        </span>
                    </div>
                </s-stack>
                <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="30%">
                    <div className={styles.title}>Business Plus</div>
                    <div className={styles.pricing}>$50 <span>/ 30 days</span></div>
                    <div className={styles.info}>3 trial days remaining</div>
                    <div>
                        <s-link href='/app/charges/plus'>
                            <s-button variant="primary" >Select</s-button>
                        </s-link>
                    </div>
                    <div className={styles.list}>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Unlimited Locations
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Faire Integration
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Shopify B2B Integration
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Major Retailer Locations
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Bulk/CSV Import & Export
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Custom Search Filters
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Google Maps Integration
                        </span>
                        <span>
                            <i className="fa-solid fa-check"></i>
                            Priority Support
                        </span>
                    </div>
                </s-stack>
            </s-stack>
        </div>
    )
}