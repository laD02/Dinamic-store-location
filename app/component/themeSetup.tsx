import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import styles from "../css/themeSetup.module.css";
import { fontList } from "app/utils/primaryFont";

export default function ThemeSetUp({ onChange, config }: { onChange: (theme: any) => void, config: any }) {
  const [primaryColor, setPrimaryColor] = useState(config?.primaryColor ?? "#000");
  const [secondaryColor, setSecondaryColor] = useState(config?.secondaryColor ?? "#000");
  const [activePicker, setActivePicker] = useState(null); // "primary" | "secondary" | null
  const [primaryFont, setPrimaryFont] = useState(config?.primaryFont ?? "Roboto");
  const [secondaryFont, setSecondaryFont] = useState(config?.secondary ?? "Open Sans");

  const togglePicker = (picker: any) => {
    setActivePicker(activePicker === picker ? null : picker);
  };

  useEffect(() => {
    if (config?.primaryColor) setPrimaryColor(config.primaryColor);
    if (config?.secondaryColor) setSecondaryColor(config.secondaryColor);
    if (config?.primaryFont) setPrimaryFont(config.primaryFont);
    if (config?.secondaryFont) setSecondaryFont(config.secondaryFont);
  }, [config]);

  useEffect(() => {
    onChange({ primaryColor, secondaryColor, primaryFont, secondaryFont });
  }, [primaryColor, secondaryColor, primaryFont, secondaryFont]);

  return (
    <div className={styles.wrapper}>
      <h4>Theme Colors</h4>

      {/* Primary color */}
      <div className={styles.colorRow}>
        <div className={styles.colorBoxWrapper}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: primaryColor }}
            onClick={() => togglePicker("primary")}
          />
          {activePicker === "primary" && (
            <div className={styles.pickerWrapper}>
              <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
            </div>
          )}
        </div>
        <div className={styles.colorInfo}>
          <strong>Primary Theme Color</strong>
          <span>{primaryColor}</span>
        </div>
      </div>

      {/* Secondary color */}
      <div className={styles.colorRow}>
        <div className={styles.colorBoxWrapper}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: secondaryColor }}
            onClick={() => togglePicker("secondary")}
          />
          {activePicker === "secondary" && (
            <div className={styles.pickerWrapper}>
              <HexColorPicker
                color={secondaryColor}
                onChange={setSecondaryColor}
              />
            </div>
          )}
        </div>
        <div className={styles.colorInfo}>
          <strong>Secondary Theme Color</strong>
          <span>{secondaryColor}</span>
        </div>
      </div>

      <h4>Theme Fonts</h4>
      <div className={styles.fontRow}>
        <div className={styles.fontColum}>
          <label>Primary Font Family</label>
          <select
            value={primaryFont}
            onChange={(e) => setPrimaryFont(e.target.value)}
          >
            {fontList.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.fontColum}>
          <label>Secondary Font Family</label>
          <select
            value={secondaryFont}
            onChange={(e) => setSecondaryFont(e.target.value)}
          >
            {fontList.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
        
      </div>
    </div>
  );
}
