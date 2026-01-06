import { useEffect, useRef, useState } from "react";
import styles from "../css/themeSetup.module.css";
import { fontList } from "app/utils/primaryFont";

export default function ThemeSetUp({ onChange, config }: { onChange: (theme: any) => void, config: any }) {
  const [primaryColor, setPrimaryColor] = useState(config?.primaryColor ?? "#000");
  const [secondaryColor, setSecondaryColor] = useState(config?.secondaryColor ?? "#000");
  const [activePicker, setActivePicker] = useState<"primary" | "secondary" | null>(null);
  const [primaryFont, setPrimaryFont] = useState(config?.primaryFont ?? "Roboto");
  const [secondaryFont, setSecondaryFont] = useState(config?.secondaryFont?? "Open Sans");

  const primaryPickerRef = useRef<HTMLDivElement | null>(null);
  const secondaryPickerRef = useRef<HTMLDivElement | null>(null);
  const lastSentRef = useRef<string>("");
  // Ref để track xem đang sync từ config hay không
  const isSyncingRef = useRef(false);

  const togglePicker = (picker: "primary" | "secondary") => {
    setActivePicker(activePicker === picker ? null : picker);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activePicker &&
        !primaryPickerRef.current?.contains(event.target as Node) &&
        !secondaryPickerRef.current?.contains(event.target as Node)
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
    
    if (config?.primaryColor && config.primaryColor !== primaryColor) 
      setPrimaryColor(config.primaryColor);
    if (config?.secondaryColor && config.secondaryColor !== secondaryColor) 
      setSecondaryColor(config.secondaryColor);
    if (config?.primaryFont && config.primaryFont !== primaryFont) 
      setPrimaryFont(config.primaryFont);
    if (config?.secondaryFont && config.secondaryFont !== secondaryFont) 
      setSecondaryFont(config.secondaryFont);
    
    console.log('Config changed:', config);
    
    // Reset flag sau một chút
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    // Không gọi nếu đang sync từ config
    if (isSyncingRef.current) {
      console.log('Skipping onChange - syncing from config');
      return;
    }

    const currentValue = JSON.stringify({ primaryColor, secondaryColor, primaryFont, secondaryFont });
    
    // Chỉ gọi onChange nếu giá trị khác với lần trước
    if (currentValue !== lastSentRef.current) {
      console.log('123 - calling onChange');
      lastSentRef.current = currentValue;
      onChange({ primaryColor, secondaryColor, primaryFont, secondaryFont });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryColor, secondaryColor, primaryFont, secondaryFont]);

  return (
    <s-stack inlineSize="100%" >
      <s-text type="strong">Theme Color</s-text>
      {/* Primary color */}
      <s-stack direction="inline" gap="small" paddingBlockStart="small" >
        <div className={styles.colorBoxWrapper} ref={primaryPickerRef}>
          <div
            className={styles.colorBox}
            style={{ backgroundColor: primaryColor }}
            onClick={() => togglePicker("primary")}
          />
          {activePicker === "primary" && (
            <div className={styles.pickerWrapper}>
              <s-box padding="small" border="base" borderRadius="base" background="subdued">
                <s-color-picker 
                  alpha
                  value={primaryColor} 
                  onInput={(e) => {
                    const target = e.currentTarget as any;
                    setPrimaryColor(target.value)
                  }}
                  onChange={(e) => {
                    const target = e.currentTarget as any;
                    setPrimaryColor(target.value)
                  }}
                />
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
        <div className={styles.colorBoxWrapper} ref={secondaryPickerRef}>
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
                  alpha
                  onInput={(e) => {
                    const target = e.currentTarget as any;
                    setSecondaryColor(target.value)
                  }}
                  onChange={(e) => {
                    const target = e.currentTarget as any;
                    setSecondaryColor(target.value)
                  }}
                />
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
          <s-stack>
            <s-text type="strong">Primary Font Family</s-text>
            <s-select value={primaryFont} onChange={(e) => setPrimaryFont(e.currentTarget.value)}>
              {fontList.map((font) => (
                  <s-option key={font} value={font}>
                    {font}
                  </s-option>
                ))}
            </s-select>
          </s-stack>
          
          <s-stack>
            <s-text type="strong">Secondary Font Family</s-text>
            <s-select value={secondaryFont} onChange={(e) => setSecondaryFont(e.currentTarget.value)}>
              {fontList.map((font) => (
                  <s-option key={font} value={font} >
                    {font}
                  </s-option>
                ))}
            </s-select> 
          </s-stack>  
        </s-stack>
      </s-stack>
    </s-stack>
  );
}
