
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
        <s-stack gap="base">
            <s-section>
                <s-stack alignItems="center" >
                    {/* <s-box></s-box> */}
                    {/* <s-box> */}
                        <s-heading>Theme Setup</s-heading>
                    {/* </s-box> */}
                    {/* <s-button icon="sort" commandFor="sort-popover"></s-button>
                    <s-popover id="sort-popover">
                        <s-stack gap="none" direction="block">
                                <s-button 
                                    variant="tertiary"
                                    onClick={() => handleSwap()}
                                >
                                    {selected === 0 ? 'Popup Style' : 'Theme Setup'}
                                </s-button>
                        </s-stack>   
                    </s-popover> */}
                </s-stack>

                <div className={styles.body}>
                    <ThemeSetUp onChange={onThemeChange} config={config.theme}/>
                    {/* <PopupStyle onChange={onPopupChange} config={config.popup}/> */}
                </div>
            </s-section>

            <s-section>
                <s-stack alignItems="center">
                    {/* <s-box></s-box> */}
                    {/* <s-box> */}
                        <s-heading>Popup Style</s-heading>
                    {/* </s-box> */}
                    {/* <s-button icon="sort" commandFor="sort-popover"></s-button>
                    <s-popover id="sort-popover">
                        <s-stack gap="none" direction="block">
                                <s-button 
                                    variant="tertiary"
                                    onClick={() => handleSwap()}
                                >
                                    {selected === 0 ? 'Popup Style' : 'Theme Setup'}
                                </s-button>
                        </s-stack>   
                    </s-popover> */}
                </s-stack>

                <div className={styles.body}>
                    {/* <ThemeSetUp onChange={onThemeChange} config={config.theme}/> */}
                    <PopupStyle onChange={onPopupChange} config={config.popup}/>
                </div>
            </s-section>
        </s-stack>
    )
}