
import styles from "../css/mapDesignerChilrent.module.css"
import { useState } from "react";
import ThemeSetUp from "./themeSetup";
import PopupStyle from "./popupStyle";
import MarkerBranding from "./markerBranding";

export default function MapDesigner({
    onThemeChange,
    onPopupChange,
    onBrandingChange,
    config,
    onClosePickerRequest
}: {
    onThemeChange: (theme: any) => void;
    onPopupChange: (popup: any) => void;
    onBrandingChange: (branding: any) => void;
    config: any,
    onClosePickerRequest?: boolean;
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
                    <s-heading>Theme Setup</s-heading>
                </s-stack>

                <div className={styles.body}>
                    <ThemeSetUp onChange={onThemeChange} config={config.theme} onClosePickerRequest={onClosePickerRequest} />
                </div>
            </s-section>

            <s-section>
                <s-stack alignItems="center">
                    <s-heading>Popup Style</s-heading>
                </s-stack>

                <div className={styles.body}>
                    <PopupStyle onChange={onPopupChange} config={config.popup} onClosePickerRequest={onClosePickerRequest} />
                </div>
            </s-section>

            <s-section>
                <s-stack alignItems="center" >
                    <s-heading>Marker & Map Branding</s-heading>
                </s-stack>
                <div className={styles.body}>
                    <MarkerBranding onChange={onBrandingChange} config={config.branding} onClosePickerRequest={onClosePickerRequest} />
                </div>
            </s-section>
        </s-stack>
    )
}