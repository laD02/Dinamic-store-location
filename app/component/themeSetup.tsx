import { useEffect, useState } from "react";
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
    <s-stack padding="large-200" borderRadius="large-200" background="base" inlineSize="100%">
      <h4>Theme Colors</h4>

      {/* Primary color */}
      <s-stack direction="inline" gap="small" paddingBlockStart="small">
        <div className={styles.colorBoxWrapper}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: primaryColor }}
            onClick={() => togglePicker("primary")}
          />
          {activePicker === "primary" && (
            <div className={styles.pickerWrapper}>
              <s-box padding="small" border="base" borderRadius="base" background="subdued">
                <s-color-picker 
                  value={primaryColor} 
                  onChange={(e) => {
                    const target = e.currentTarget as any;
                    setPrimaryColor(target.value)
                  }}/>
              </s-box>
            </div>
          )}
        </div>
        <s-stack>
          <s-text type="strong">Primary Theme Color</s-text>
          <s-text color="subdued">{primaryColor}</s-text>
        </s-stack>
      </s-stack>

      {/* Secondary color */}
      <s-stack direction="inline" gap="small" paddingBlockStart="small">
        <div className={styles.colorBoxWrapper}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: secondaryColor }}
            onClick={() => togglePicker("secondary")}
          />
          {activePicker === "secondary" && (
            <div className={styles.pickerWrapper}>
              {/* <HexColorPicker
                color={secondaryColor}
                onChange={setSecondaryColor}
              /> */}
              <s-box padding="small" border="base" borderRadius="base" background="subdued">
                <s-color-picker 
                  value={secondaryColor} 
                  onChange={(e) => {
                    const target = e.currentTarget as any;
                    setSecondaryColor(target.value)
                  }}/>
              </s-box>
            </div>
          )}
        </div>
        <s-stack>
          <s-text type="strong">Secondary Theme Color</s-text>
          <s-text color="subdued">{secondaryColor}</s-text>
        </s-stack>
      </s-stack>

      <s-stack gap="small" paddingBlockStart="large">
        <s-text type="strong">Theme Fonts</s-text>
        <s-stack gap="small-100">
          <s-select label="Primary Font Family" value={primaryFont} onChange={(e) => setPrimaryFont(e.currentTarget.value)}>
            {fontList.map((font) => (
                <s-option key={font} value={font} >
                  {font}
                </s-option>
              ))}
          </s-select>
          
          <s-select label="Secondary Font Family" value={secondaryFont} onChange={(e) => setSecondaryFont(e.currentTarget.value)}>
            {fontList.map((font) => (
                <s-option key={font} value={font} >
                  {font}
                </s-option>
              ))}
          </s-select>   
        </s-stack>
      </s-stack>
    </s-stack>
  );
}
