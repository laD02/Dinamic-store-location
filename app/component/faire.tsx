import styles from "../css/faire.module.css"

export default function Faire () {
    return (
        <div className={styles.wrapper}>
            <div className={styles.boxFaire}>
                <h2>Faire</h2>
                <p>Automatically display and update the information for your Faire retailers on your map. The last 6 months of orders will be automatically synced after authentication. For ongoing updates, you can choose to initiate manual syncs or automatically sync every 24 hours using the settings below.</p>
                <button>Faire Account Login</button>
            </div>

            <div className={styles.faireHelp}>
                <div className={styles.title}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>How does the Faire Integration work?</span>
                </div>
                <div className={styles.content}>
                    <p>Only Faire retailers that have a publicly available brick-and-mortar address on Google will be pulled into your Dynamic Store Locator account. If our software is not able to identify a brick-and-mortar address on Google for the retailer in question, they will not be added to your locations list.</p>
                </div>
            </div>
        </div>
    )
}