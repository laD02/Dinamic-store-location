import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router"
import styles from "../css/plan.module.css"
import prisma from "app/db.server"

export async function loader({ request }: LoaderFunctionArgs) {
    const level = await prisma.plan.findFirst()
    return level?.level
}

export default function Plan() {
    const level = useLoaderData()
    const navigate = useNavigate()

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.headerContainer}>
                    <div className={styles.backBtn} onClick={() => navigate(-1)}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </div>
                    <h3>Select a plan</h3>
                </div>
                <p className={styles.subtitle}>Choose the best plan for your store's growing needs</p>
            </div>

            <div className={styles.plansGrid}>
                {/* Basic Plan */}
                <div className={styles.planCardWrapper}>
                    <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="100%" blockSize="100%">
                        <div className={styles.contentFlex}>
                            <s-stack direction="inline" justifyContent="space-between">
                                <div className={styles.titleWrapper}>
                                    <div className={styles.title}>Basic</div>
                                </div>
                                {level === 'basic' && (
                                    <s-box>
                                        <s-badge tone="info">Current</s-badge>
                                    </s-box>
                                )}
                            </s-stack>

                            <div className={styles.pricing}>Free</div>
                            <div className={styles.info}></div>

                            <div className={styles.buttonWrapper}>
                                {level === 'basic' ? (
                                    <s-box blockSize="100%" inlineSize="100%"></s-box>
                                ) : (
                                    <div style={{ width: '100%' }}>
                                        <s-link href='/app/charges/basic'>
                                            <s-button variant="primary">Select</s-button>
                                        </s-link>
                                    </div>
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <div className={styles.list}>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Up to 10 Locations</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Custom Search Filters</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Google Maps Integration</span>
                                </div>
                            </div>
                        </div>
                    </s-stack>
                </div>

                {/* Advanced Plan */}
                <div className={`${styles.planCardWrapper} ${styles.popularCard}`}>
                    <div className={styles.popularBadge}>Most Popular</div>
                    <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="100%" blockSize="100%">
                        <div className={styles.contentFlex}>
                            <s-stack direction="inline" justifyContent="space-between">
                                <div className={styles.titleWrapper}>
                                    <div className={styles.title}>Advanced</div>
                                </div>
                                {level === 'advanced' && (
                                    <s-box>
                                        <s-badge tone="info">Current</s-badge>
                                    </s-box>
                                )}
                            </s-stack>

                            <div className={styles.pricing}>$30 <span>/ 30 days</span></div>
                            <div className={styles.info}>3 trial days remaining</div>

                            <div className={styles.buttonWrapper}>
                                {level === 'advanced' ? (
                                    <s-box blockSize="100%" inlineSize="100%"></s-box>
                                ) : (
                                    <div style={{ width: '100%' }}>
                                        <s-link href='/app/charges/advanced'>
                                            <s-button variant="primary">Select</s-button>
                                        </s-link>
                                    </div>
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <div className={styles.list}>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Up to 1,500 Locations</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Faire Integration</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Bulk/CSV Import & Export</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Custom Search Filters</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Google Maps Integration</span>
                                </div>
                            </div>
                        </div>
                    </s-stack>
                </div>

                {/* Business Plus Plan */}
                <div className={styles.planCardWrapper}>
                    <s-stack padding="large-200" background="base" borderRadius="large-200" borderWidth="base" inlineSize="100%" blockSize="100%">
                        <div className={styles.contentFlex}>
                            <s-stack direction="inline" justifyContent="space-between">
                                <div className={styles.titleWrapper}>
                                    <div className={styles.title}>Business Plus</div>
                                </div>
                                {level === 'plus' && (
                                    <s-box>
                                        <s-badge tone="info">Current</s-badge>
                                    </s-box>
                                )}
                            </s-stack>

                            <div className={styles.pricing}>$50 <span>/ 30 days</span></div>
                            <div className={styles.info}>3 trial days remaining</div>

                            <div className={styles.buttonWrapper}>
                                {level === 'plus' ? (
                                    <s-box blockSize="100%" inlineSize="100%"></s-box>
                                ) : (
                                    <div style={{ width: '100%' }}>
                                        <s-link href='/app/charges/plus'>
                                            <s-button variant="primary">Select</s-button>
                                        </s-link>
                                    </div>
                                )}
                            </div>

                            <div className={styles.divider}></div>

                            <div className={styles.list}>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Unlimited Locations</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Faire Integration</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Shopify B2B Integration</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Major Retailer Locations</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Bulk/CSV Import & Export</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Custom Search Filters</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Google Maps Integration</span>
                                </div>
                                <div className={styles.listItem}>
                                    <i className={`fa-solid fa-check ${styles.checkIcon}`}></i>
                                    <span>Priority Support</span>
                                </div>
                            </div>
                        </div>
                    </s-stack>
                </div>
            </div>
        </div>
    )
}