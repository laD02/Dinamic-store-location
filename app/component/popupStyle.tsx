import { useEffect, useRef, useState } from "react";
import styles from "../css/popupStyle.module.css"

export default function PopupStyle ({ onChange, config }: { onChange: (popup: any) => void, config: any }) {
    const [backgroundColor, setBackgroundColor] = useState(config?.backgroundColor ?? "#fff");
    const [color, setColor] = useState( config?.color ?? "#000000")
    const [iconColor, setIconColor] = useState(config?.iconColor ?? "#5230f9")
    const [shadowColor, setShadowColor] = useState(config?.shadowColor ?? "#000000")
    const [transparency, setTransparency] = useState<number>(config?.transparency ?? 60)
    const [blur, setBlur] = useState<number>(config?.blur ?? 4)
    const [anchorx, setAnchorx] = useState<number>(config?.anchorx ?? -2)
    const [anchory, setAnchory] = useState<number>(config?.anchory ?? -2)
    const [cornerRadius, setCornerRadius] = useState<number>(config?.cornerRadius ?? 3)
    const [activePicker, setActivePicker] = useState(null); 

    const backgroundPickerRef = useRef<HTMLDivElement | null>(null);
    const colorPickerRef = useRef<HTMLDivElement | null>(null);
    const iconPickerRef = useRef<HTMLDivElement | null>(null);
    const shadowPickerRef = useRef<HTMLDivElement | null>(null);

    const togglePicker = (picker: any) => {
        setActivePicker(activePicker === picker ? null : picker);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const refs = [
                backgroundPickerRef.current,
                colorPickerRef.current,
                iconPickerRef.current,
                shadowPickerRef.current
            ];

            if (activePicker && !refs.some(ref => ref?.contains(event.target as Node))) {
                setActivePicker(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePicker]);

    useEffect(() => {
        if (config?.backgroundColor) setBackgroundColor(config.backgroundColor)
        if (config?.color) setColor(config.color)
        if (config?.iconColor) setIconColor(config.iconColor)
        if (config?.shadowColor) setShadowColor(config.shadowColor)
        if (config?.transparency) setTransparency(config.transparency)
        if (config?.blur) setBlur(config.blur)
        if (config?.anchorx) setAnchorx(config.anchorx)
        if (config?.anchory) setAnchory(config.anchory)
        if (config?.cornerRadius) setCornerRadius(config.cornerRadius)  
    },[config])

    useEffect(() => {
        onChange({backgroundColor, color, iconColor, shadowColor, transparency, blur, anchorx, anchory, cornerRadius});
    }, [backgroundColor, color, iconColor, shadowColor, transparency, blur, anchorx, anchory, cornerRadius])
    return (
        <s-stack padding="large-200" borderRadius="large-200" background="base" inlineSize="100%" direction="inline" justifyContent="space-between">
            <div className={styles.leftBox}>
                <h4>Popup Box</h4>
                <div className={styles.backgroundColor} ref={backgroundPickerRef}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: backgroundColor}}
                        onClick={() => togglePicker("backgroundColor")}
                    />
                    {activePicker === "backgroundColor" && (
                        <div className={styles.pickerWrapper}>
                            {/* <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} /> */}
                            <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                <s-color-picker 
                                value={backgroundColor} 
                                onChange={(e) => {
                                    const target = e.currentTarget as any;
                                    setBackgroundColor(target.value)
                                }}/>
                            </s-box>
                        </div>
                    )}
                    <div className={styles.colorInfo}> 
                        <strong>Background Color</strong>
                        <span>{backgroundColor}</span>
                    </div>
                </div>
                <div className={styles.corner}>
                    <label>corner radius</label>
                    <div className={styles.inputRange}>
                        <span>0</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="20"
                            step="1" 
                            value={cornerRadius}
                            onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                            style={{
                                background: `linear-gradient(to right, #333 0%, #333 ${(cornerRadius / 20) * 100}%, #ddd ${(cornerRadius/ 20) * 100}%, #ddd 100%)`
                            }}
                        />
                        <span>{cornerRadius}pt</span>
                    </div>
                </div>
                <s-divider />
                <h4>Font Color</h4>
                <div className={styles.backgroundColor} ref={colorPickerRef}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: color}}
                        onClick={() => togglePicker("color")}
                    />
                    {activePicker === "color" && (
                        <div className={styles.pickerWrapper}>
                            {/* <HexColorPicker color={color} onChange={setColor} /> */}
                            <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                <s-color-picker 
                                value={color} 
                                onChange={(e) => {
                                    const target = e.currentTarget as any;
                                    setColor(target.value)
                                }}/>
                            </s-box>
                        </div>
                    )}
                    <div className={styles.colorInfo}> 
                        <strong>Color</strong>
                        <span>{color}</span>
                    </div>
                </div>
                <div className={styles.backgroundColor} ref={iconPickerRef}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: iconColor}}
                        onClick={() => togglePicker("iconColor")}
                    />
                    {activePicker === "iconColor" && (
                        <div className={styles.pickerWrapper}>
                            {/* <HexColorPicker color={iconColor} onChange={setIconColor} /> */}
                            <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                <s-color-picker 
                                value={iconColor} 
                                onChange={(e) => {
                                    const target = e.currentTarget as any;
                                    setIconColor(target.value)
                                }}/>
                            </s-box>
                        </div>
                    )}
                    <div className={styles.colorInfo}> 
                        <strong>Icon Color</strong>
                        <span>{iconColor}</span>
                    </div>
                </div>
            </div>
            <s-divider direction="block"/>
            <div className={styles.rightBox}>
                <h4>Drop Shadow</h4>
                <div className={styles.backgroundColor} ref={shadowPickerRef}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: shadowColor}}
                        onClick={() => togglePicker("shadowColor")}
                    />
                    {activePicker === "shadowColor" && (
                        <div className={styles.pickerWrapper}>
                            {/* <HexColorPicker color={iconColor} onChange={setShadowColor} /> */}
                            <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                <s-color-picker 
                                value={shadowColor} 
                                onChange={(e) => {
                                    const target = e.currentTarget as any;
                                    setShadowColor(target.value)
                                }}/>
                            </s-box>
                        </div>
                    )}
                    <div className={styles.colorInfo}> 
                        <strong>Shadow Color</strong>
                        <span>{shadowColor}</span>
                    </div>
                </div>
                <div className={styles.corner}>
                    <label>transparency</label>
                    <div className={styles.inputRange}>
                        <span>0%</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="100"
                            step="1" 
                            value={transparency}
                            onChange={(e) => setTransparency(parseInt(e.target.value))}
                            style={{
                                background: `linear-gradient(to right, #333 0%, #333 ${transparency}%, #ddd ${transparency}%, #ddd 100%)`
                            }}
                        />
                        <span>{transparency}%</span>
                    </div>
                </div>
                <div className={styles.corner}>
                    <label>blur radius</label>
                    <div className={styles.inputRange}>
                        <span>0</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="20"
                            step="1" 
                            value={blur}
                            onChange={(e) => setBlur(parseInt(e.target.value))}
                            style={{
                                background: `linear-gradient(to right, #333 0%, #333 ${(blur / 20) * 100}%, #ddd ${(blur / 20) * 100}%, #ddd 100%)`
                            }}
                        />
                        <span>{blur}</span>
                    </div>
                </div>
                <div className={styles.corner}>
                    <label>anchor x coordinate</label>
                    <div className={styles.inputRange}>
                        <span>-10</span>
                        <input 
                            type="range" 
                            min="-10" 
                            max="10"
                            step="1" 
                            value={anchorx}
                            onChange={(e) => setAnchorx(parseInt(e.target.value))}
                            style={{
                                background: `linear-gradient(to right, #333 0%, #333 ${((anchorx - (-10))/ 20) * 100}%, #ddd ${((anchorx - (-10)) / 20) * 100}%, #ddd 100%)`
                            }}
                        />
                        <span>{anchorx}</span>
                    </div>
                </div>
                <div className={styles.corner}>
                    <label>anchor y coordinate</label>
                    <div className={styles.inputRange}>
                        <span>-10</span>
                        <input 
                            type="range" 
                            min="-10" 
                            max="10"
                            step="1" 
                            value={anchory}
                            onChange={(e) => setAnchory(parseInt(e.target.value))}
                            style={{
                                background: `linear-gradient(to right, #333 0%, #333 ${((anchory - (-10))/ 20) * 100}%, #ddd ${((anchory - (-10)) / 20) * 100}%, #ddd 100%)`
                            }}
                        />
                        <span>{anchory}</span>
                    </div>
                </div>
            </div>
        </s-stack>
    )
}