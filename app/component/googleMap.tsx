import styles from "../css/googleMap.module.css"

export default function GoogleMap () {
    return (
        <div className={styles.wrapper}>
            <div className={styles.boxGoogleMap}>
                <h2>Google Maps</h2>
                <div className={styles.connection}>
                    <h3>API Key Connection</h3>
                    <p>In order to use Google Maps on your site you must sign up for an API Key with Google. <a href="https://cloud.google.com/?hl=en">Click here</a> to get an API key and paste it below when you have created one.</p>
                </div>
                <input 
                    placeholder="Enter an API key for your map"
                />
                <div className={styles.btnSave}>
                    <button >
                        save
                    </button>
                </div>
            </div>

            <div className={styles.needHelp}>
                <div className={styles.title}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>Need Help Setting up your API Key?</span>
                </div>
                <div className={styles.content}>
                    <p>We created a step-by-step guide to walk you through setting up a Google Maps API Key. <a href="https://www.h1-apps.com/articles/how-to-setup-a-google-maps-api-key">Click here</a> to access that guide.</p>
                </div>
            </div>
        </div>
    )
}