
import styles from "../css/mapDesignerChilrent.module.css"
import { useState } from "react";
import ThemeSetUp from "./themeSetup";
import PopupStyle from "./popupStyle";

export default function MapDesigner ({ 
    onThemeChange,
    onPopupChange,
    config,
}: { 
    onThemeChange: (theme: any) => void;
    onPopupChange: (popup: any) => void;  
    config: any,
}) {

    const listDesign = ["theme Setup", "Popup Style"]
    const [selected, setSeleceted] = useState<number>(0)

    return (
        <s-stack gap="large">
            <s-stack>
                <div className={styles.header}>
                    <h2>Map Designer</h2>
                </div>

                <div className={styles.list}>
                    {
                        listDesign.map((item, index) => (
                            <div 
                                className={`${styles.listItem} ${selected === index ? styles.active : ""}`} 
                                key={index} 
                                onClick={() => setSeleceted(index)}
                            >
                                {item}
                            </div>
                        ))
                    }
                </div>
            </s-stack>

            <div className={styles.body}>
                {selected === 0 && <ThemeSetUp onChange={onThemeChange} config={config.theme}/>}
                {selected === 1 && <PopupStyle onChange={onPopupChange} config={config.popup}/>}
            </div>
        </s-stack>
    )
}