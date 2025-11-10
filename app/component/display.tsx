import styles from "../css/display.module.css"

export default function Display () {
    return (
        <div className={styles.wrapper}>
            <div className={styles.change}>
                <h3>Change Language</h3>
                <span>Change the language of the app. Select the desired language from the dropdown list.</span>
            </div>

            <div className={styles.select}>
                <label>Select Language</label>
                <select>
                    <option>English</option>
                </select>
                <div className={styles.btnSave}>
                    <button>Save</button>
                </div>
            </div>
        </div>
    )
}