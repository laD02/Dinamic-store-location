
import styles from "../css/mapDesignerChilrent.module.css"
import { useState } from "react";
import ThemeSetUp from "./themeSetup";
import PopupStyle from "./popupStyle";
import { useNavigation } from "react-router";

export default function MapDesigner ({ 
    onThemeChange,
    onPopupChange,
    onSave,
    config,
    isSaving
}: { 
    onThemeChange: (theme: any) => void;
    onPopupChange: (popup: any) => void;  
    onSave: () => void,
    config: any,
    isSaving: boolean
}) {

    const listDesign = ["theme Setup", "Popup Style"]
    const [selected, setSeleceted] = useState<number>(0)

    return (
        <s-stack gap="large">
            <s-stack>
                <div className={styles.header}>
                    <h2>Map Designer</h2>
                    <s-button
                        variant="secondary"
                        onClick={onSave}
                        icon="arrow-down"
                        type="submit"
                        loading={isSaving}
                    >
                        save
                    </s-button>
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