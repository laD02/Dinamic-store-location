
import { useEffect, useState } from "react";
import styles from "../css/popupStyle.module.css"
import { HexColorPicker } from "react-colorful";

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

    const togglePicker = (picker: any) => {
        setActivePicker(activePicker === picker ? null : picker);
    };

    useEffect(() => {
        onChange({backgroundColor, color, iconColor, shadowColor, transparency, blur, anchorx, anchory, cornerRadius});
    }, [backgroundColor, color, iconColor, shadowColor, transparency, blur, anchorx, anchory, cornerRadius])
    return (
        <div className={styles.wrapper}>
            <div className={styles.leftBox}>
                <h4>Popup Box</h4>
                <div className={styles.backgroundColor}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: backgroundColor}}
                        onClick={() => togglePicker("backgroundColor")}
                    />
                    {activePicker === "backgroundColor" && (
                        <div className={styles.pickerWrapper}>
                            <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
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
                <hr className={styles.hrRow}/>
                <h4>Font Color</h4>
                <div className={styles.backgroundColor}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: color}}
                        onClick={() => togglePicker("color")}
                    />
                    {activePicker === "color" && (
                        <div className={styles.pickerWrapper}>
                            <HexColorPicker color={color} onChange={setColor} />
                        </div>
                    )}
                    <div className={styles.colorInfo}> 
                        <strong>Color</strong>
                        <span>{color}</span>
                    </div>
                </div>
                <div className={styles.backgroundColor}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: iconColor}}
                        onClick={() => togglePicker("iconColor")}
                    />
                    {activePicker === "iconColor" && (
                        <div className={styles.pickerWrapper}>
                            <HexColorPicker color={iconColor} onChange={setIconColor} />
                        </div>
                    )}
                    <div className={styles.colorInfo}> 
                        <strong>Icon Color</strong>
                        <span>{iconColor}</span>
                    </div>
                </div>
            </div>
            <hr className={styles.hrColum} />
            <div className={styles.rightBox}>
                <h4>Drop Shadow</h4>
                <div className={styles.backgroundColor}>
                    <div 
                        className={styles.colorBox}
                        style={{ backgroundColor: shadowColor}}
                        onClick={() => togglePicker("shadowColor")}
                    />
                    {activePicker === "shadowColor" && (
                        <div className={styles.pickerWrapper}>
                            <HexColorPicker color={iconColor} onChange={setShadowColor} />
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
        </div>
    )
}