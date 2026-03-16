
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
    level,
    onClosePickerRequest,
    activeTab,
    onTabChange
}: {
    onThemeChange: (theme: any) => void;
    onPopupChange: (popup: any) => void;
    onBrandingChange: (branding: any) => void;
    config: any,
    level: string;
    onClosePickerRequest?: boolean;
    activeTab: number;
    onTabChange: (tab: number) => void;
}) {

    const tabs = [
        { id: 0, label: "Theme Setup" },
        { id: 1, label: "Popup Style" },
        { id: 2, label: "Marker Branding" }
    ];

    return (
        <s-stack gap="base">
            <s-section>
                <div className={styles.tabContainer}>
                    <ul className={styles.list}>
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                className={`${styles.listItem} ${activeTab === tab.id ? styles.active : ''}`}
                                onClick={() => onTabChange(tab.id)}
                            >
                                {tab.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.body}>
                    {activeTab === 0 && (
                        <ThemeSetUp onChange={onThemeChange} config={config.theme} onClosePickerRequest={onClosePickerRequest} />
                    )}
                    {activeTab === 1 && (
                        <PopupStyle onChange={onPopupChange} config={config.popup} onClosePickerRequest={onClosePickerRequest} />
                    )}
                    {activeTab === 2 && (
                        <MarkerBranding onChange={onBrandingChange} config={config.branding} level={level} onClosePickerRequest={onClosePickerRequest} />
                    )}
                </div>
            </s-section>
        </s-stack>
    )
}