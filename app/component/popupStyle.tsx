import { useEffect, useRef, useState } from "react";
import styles from "../css/popupStyle.module.css"

export default function PopupStyle({ onChange, config }: { onChange: (popup: any) => void, config: any }) {
    const [backgroundColor, setBackgroundColor] = useState(config?.backgroundColor ?? "#fff");
    const [color, setColor] = useState(config?.color ?? "#000000")
    const [iconColor, setIconColor] = useState(config?.iconColor ?? "#5230f9")
    const [shadowColor, setShadowColor] = useState(config?.shadowColor ?? "#000000")
    const [transparency, setTransparency] = useState<number>(config?.transparency ?? 60)
    const [blur, setBlur] = useState<number>(config?.blur ?? 4)
    const [anchorx, setAnchorx] = useState<number>(config?.anchorx ?? -2)
    const [anchory, setAnchory] = useState<number>(config?.anchory ?? -2)
    const [cornerRadius, setCornerRadius] = useState<number>(config?.cornerRadius ?? 3)
    const [activePicker, setActivePicker] = useState<"backgroundColor" | "color" | "iconColor" | "shadowColor" | null>(null);

    const backgroundPickerRef = useRef<HTMLDivElement | null>(null);
    const colorPickerRef = useRef<HTMLDivElement | null>(null);
    const iconPickerRef = useRef<HTMLDivElement | null>(null);
    const shadowPickerRef = useRef<HTMLDivElement | null>(null);
    // Ref để lưu giá trị đã gửi lần cuối
    const lastSentRef = useRef<string>("");
    // Ref để track xem đang sync từ config hay không
    const isSyncingRef = useRef(false);

    const togglePicker = (picker: "backgroundColor" | "color" | "iconColor" | "shadowColor") => {
        setActivePicker(activePicker === picker ? null : picker);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                activePicker &&
                !backgroundPickerRef.current?.contains(event.target as Node) &&
                !colorPickerRef.current?.contains(event.target as Node) &&
                !iconPickerRef.current?.contains(event.target as Node) &&
                !shadowPickerRef.current?.contains(event.target as Node)
            ) {
                setActivePicker(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePicker]);

    useEffect(() => {
        if (!config) return;

        isSyncingRef.current = true;

        if (config?.backgroundColor && config.backgroundColor !== backgroundColor)
            setBackgroundColor(config.backgroundColor);
        if (config?.color && config.color !== color)
            setColor(config.color);
        if (config?.iconColor && config.iconColor !== iconColor)
            setIconColor(config.iconColor);
        if (config?.shadowColor && config.shadowColor !== shadowColor)
            setShadowColor(config.shadowColor);
        if (config?.transparency !== undefined && config.transparency !== transparency)
            setTransparency(config.transparency);
        if (config?.blur !== undefined && config.blur !== blur)
            setBlur(config.blur);
        if (config?.anchorx !== undefined && config.anchorx !== anchorx)
            setAnchorx(config.anchorx);
        if (config?.anchory !== undefined && config.anchory !== anchory)
            setAnchory(config.anchory);
        if (config?.cornerRadius !== undefined && config.cornerRadius !== cornerRadius)
            setCornerRadius(config.cornerRadius);

        // Reset flag sau một chút
        setTimeout(() => {
            isSyncingRef.current = false;
        }, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    // Gọi onChange chỉ khi giá trị thực sự thay đổi
    useEffect(() => {
        // Không gọi nếu đang sync từ config
        if (isSyncingRef.current) {
            return;
        }

        const currentValue = JSON.stringify({
            backgroundColor,
            color,
            iconColor,
            shadowColor,
            transparency,
            blur,
            anchorx,
            anchory,
            cornerRadius
        });

        // Chỉ gọi onChange nếu giá trị khác với lần trước
        if (currentValue !== lastSentRef.current) {
            lastSentRef.current = currentValue;
            onChange({ backgroundColor, color, iconColor, shadowColor, transparency, blur, anchorx, anchory, cornerRadius });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor, color, iconColor, shadowColor, transparency, blur, anchorx, anchory, cornerRadius]);

    return (
        <s-stack inlineSize="100%" >
            <div className={styles.maxBlockSize}>
                <div className={styles.leftBox}>
                    <s-text type="strong">Popup Box</s-text>
                    <div className={styles.backgroundColor}>
                        <div ref={backgroundPickerRef}>
                            <div
                                className={styles.colorBox}
                                style={{ backgroundColor: backgroundColor }}
                                onClick={() => togglePicker("backgroundColor")}
                            />
                            {activePicker === "backgroundColor" && (
                                <div className={styles.pickerWrapper}>
                                    {/* <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} /> */}
                                    <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                        <s-color-picker
                                            value={backgroundColor}
                                            alpha
                                            onInput={(e) => {
                                                const target = e.currentTarget as any;
                                                setBackgroundColor(target.value)
                                            }}
                                            onChange={(e) => {
                                                const target = e.currentTarget as any;
                                                setBackgroundColor(target.value)
                                            }}
                                        />
                                    </s-box>
                                </div>
                            )}
                        </div>
                        <div className={styles.colorInfo}>
                            <strong>Background Color</strong>
                            <span>{backgroundColor}</span>
                        </div>
                    </div>
                    <div className={styles.corner}>
                        <s-text type="strong">Corner radius</s-text>
                        <div className={styles.inputRange}>
                            <span>0px</span>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                step="1"
                                value={cornerRadius}
                                onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, #333 0%, #333 ${(cornerRadius / 20) * 100}%, #ddd ${(cornerRadius / 20) * 100}%, #ddd 100%)`
                                }}
                            />
                            <span>{cornerRadius}px</span>
                        </div>
                    </div>
                    {/* <s-divider /> */}
                    <s-text type="strong">Font Color</s-text>
                    <div className={styles.backgroundColor} >
                        <div ref={colorPickerRef}>
                            <div
                                className={styles.colorBox}
                                style={{ backgroundColor: color }}
                                onClick={() => togglePicker("color")}
                            />
                            {activePicker === "color" && (
                                <div className={styles.pickerWrapper}>
                                    {/* <HexColorPicker color={color} onChange={setColor} /> */}
                                    <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                        <s-color-picker
                                            value={color}
                                            alpha
                                            onInput={(e) => {
                                                const target = e.currentTarget as any;
                                                setColor(target.value)
                                            }}
                                            onChange={(e) => {
                                                const target = e.currentTarget as any;
                                                setColor(target.value)
                                            }}
                                        />
                                    </s-box>
                                </div>
                            )}
                        </div>
                        <div className={styles.colorInfo}>
                            <strong>Color</strong>
                            <span>{color}</span>
                        </div>
                    </div>
                    <div className={styles.backgroundColor}>
                        <div ref={iconPickerRef}>
                            <div
                                className={styles.colorBox}
                                style={{ backgroundColor: iconColor }}
                                onClick={() => togglePicker("iconColor")}
                            />
                            {activePicker === "iconColor" && (
                                <div className={styles.pickerWrapper}>
                                    {/* <HexColorPicker color={iconColor} onChange={setIconColor} /> */}
                                    <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                        <s-color-picker
                                            value={iconColor}
                                            alpha
                                            onInput={(e) => {
                                                const target = e.currentTarget as any;
                                                setIconColor(target.value)
                                            }}
                                            onChange={(e) => {
                                                const target = e.currentTarget as any;
                                                setIconColor(target.value)
                                            }}
                                        />
                                    </s-box>
                                </div>
                            )}
                        </div>
                        <div className={styles.colorInfo}>
                            <strong>Icon Color</strong>
                            <span>{iconColor}</span>
                        </div>
                    </div>
                    {/* </div>
                <s-divider direction="block"/>
                <div className={styles.rightBox}> */}
                    <s-text type="strong">Drop Shadow</s-text>
                    <div className={styles.backgroundColor} >
                        <div ref={shadowPickerRef}>
                            <div
                                className={styles.colorBox}
                                style={{ backgroundColor: shadowColor }}
                                onClick={() => togglePicker("shadowColor")}
                            />
                            {activePicker === "shadowColor" && (
                                <div className={styles.pickerWrapper}>
                                    {/* <HexColorPicker color={iconColor} onChange={setShadowColor} /> */}
                                    <s-box padding="small" border="base" borderRadius="base" background="subdued">
                                        <s-color-picker
                                            value={shadowColor}
                                            alpha
                                            onInput={(e) => {
                                                const target = e.currentTarget as any;
                                                setShadowColor(target.value)
                                            }}
                                            onChange={(e) => {
                                                const target = e.currentTarget as any;
                                                setShadowColor(target.value)
                                            }}
                                        />
                                    </s-box>
                                </div>
                            )}
                        </div>
                        <div className={styles.colorInfo}>
                            <strong>Shadow Color</strong>
                            <span>{shadowColor}</span>
                        </div>
                    </div>
                    <div className={styles.corner}>
                        <strong>Transparency</strong>
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
                        <strong>Blur radius</strong>
                        <div className={styles.inputRange}>
                            <span>0px</span>
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
                            <span>{blur}px</span>
                        </div>
                    </div>
                    <div className={styles.corner}>
                        <strong>Anchor x coordinate</strong>
                        <div className={styles.inputRange}>
                            <span>-10px</span>
                            <input
                                type="range"
                                min="-10"
                                max="10"
                                step="1"
                                value={anchorx}
                                onChange={(e) => setAnchorx(parseInt(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, #333 0%, #333 ${((anchorx - (-10)) / 20) * 100}%, #ddd ${((anchorx - (-10)) / 20) * 100}%, #ddd 100%)`
                                }}
                            />
                            <span>{anchorx}px</span>
                        </div>
                    </div>
                    <div className={styles.corner}>
                        <strong>Anchor y coordinate</strong>
                        <div className={styles.inputRange}>
                            <span>-10px</span>
                            <input
                                type="range"
                                min="-10"
                                max="10"
                                step="1"
                                value={anchory}
                                onChange={(e) => setAnchory(parseInt(e.target.value))}
                                style={{
                                    background: `linear-gradient(to right, #333 0%, #333 ${((anchory - (-10)) / 20) * 100}%, #ddd ${((anchory - (-10)) / 20) * 100}%, #ddd 100%)`
                                }}
                            />
                            <span>{anchory}px</span>
                        </div>
                    </div>
                </div>
            </div>
        </s-stack>
    )
}