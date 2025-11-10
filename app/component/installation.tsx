import styles from "../css/installation.module.css"

export default function Installation () {

    return (
        <div className={styles.wrapper}>
            <div className={styles.option}>
                <div className={styles.boxLeft}>
                    <span>Option 1:</span>
                    <h4>How to Add the App Block</h4>
                    <span>Recommended installation method. Your store must be using Shopify 2.0 to utilize this method.</span>
                </div>

                <div className={styles.boxRight}>
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>Step 1</span>
                            <h4>Open the Shopify CMS</h4>
                        </div>

                        <div className={styles.stepContent}>
                            In your Shopify account, click 'Online Store' on the left side, and then click 'Customize' next to the theme where you want to install the map.
                        </div>
                    </div>
                    <hr />
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>Step 2</span>
                            <h4>Find the Page Where You Want to Install the Store Locator</h4>
                        </div>

                        <div className={styles.stepContent}>
                            In the top bar, click the drop down and go to 'Pages' and find the page where you want to install the locator. If you want to install it on a new page, you'll need to first create the page in your Shopify Admin under 'Pages'.
                        </div>
                    </div>
                    <hr />
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>Step 3</span>
                            <h4>Add a New Section</h4>
                        </div>

                        <div className={styles.stepContent}>
                            Click 'Add Section' on the left side of the CMS tool bar and toggle to the Apps'. Find the 'H1 Dynamic Store Locator' app and click it to add it to the page.
                        </div>
                    </div>
                    <hr />
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>Step 4</span>
                            <h4>Place Your Map</h4>
                        </div>

                        <div className={styles.stepContent}>
                            After that, you can drag and drop your map anywhere on the page, or add in headings and content above or below it.
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.option}>
                <div className={styles.boxLeft}>
                    <span>Option 2:</span>
                    <h4>HTML Embed</h4>
                    <span>Copy and paste the code snippet into an HTML block of the page where you wish the store locator to be visible.</span>
                </div>
                
                <div className={styles.boxRight}>
                    <div className={styles.step}>
                        <div className={styles.stepTitle}>
                            <span>Step1</span>
                            <h4>Copy the Embed Code</h4>
                        </div>

                        <div className={styles.stepContent}>
                            Copy and paste the code snippet below into an HTML block of the page where you wish the store locator to be visible.    
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}