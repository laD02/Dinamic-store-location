
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

    const listDesign = ["Theme Setup", "Popup Style"]
    const [title, setTitle] = useState('Theme Setup')
    const [selected, setSeleceted] = useState<number>(0)

    const handleSwap = () => {
        const index = selected === 0 ? 1 : 0
        setSeleceted(index)
    }

    return (
        <s-stack>
            {/* <s-stack>
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
            </s-stack> */}
            <s-stack direction="inline" justifyContent="space-between" background="base" inlineSize="100%" paddingInline="small" paddingBlockStart="small" alignItems="center">
                <s-box></s-box>
                <s-box>
                    <s-heading>{selected === 0 ? 'Theme Setup' : 'Popup Style'}</s-heading>
                </s-box>
                <s-button icon="sort" commandFor="sort-popover"></s-button>
                <s-popover id="sort-popover">
                    <s-stack gap="none" direction="block">
                            <s-button 
                                variant="tertiary"
                                onClick={() => handleSwap()}
                            >
                                {selected === 0 ? 'Popup Style' : 'Theme Setup'}
                            </s-button>
                    </s-stack>   
                </s-popover>
            </s-stack>

            <div className={styles.body}>
                {selected === 0 && <ThemeSetUp onChange={onThemeChange} config={config.theme}/>}
                {selected === 1 && <PopupStyle onChange={onPopupChange} config={config.popup}/>}
            </div>
        </s-stack>
    )
}