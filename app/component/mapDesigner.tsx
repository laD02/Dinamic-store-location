
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

    const [selected, setSeleceted] = useState<number>(0)

    const handleSwap = () => {
        const index = selected === 0 ? 1 : 0
        setSeleceted(index)
    }

    return (
        <s-stack>
            <s-stack direction="inline" justifyContent="space-between" background="base" inlineSize="100%" paddingInline="small" paddingBlockStart="small" alignItems="center" borderRadius="large-100 large-100 none none" borderWidth="small small none small">
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