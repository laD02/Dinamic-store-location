import { mapThemes } from "../../utils/mapThemes";

interface MapThemeSectionProps {
    mapStyleName: string;
    onThemeChange: (themeName: string) => void;
}

export default function MapThemeSection({
    mapStyleName,
    onThemeChange
}: MapThemeSectionProps) {
    return (
        <s-stack gap="small" paddingBlockEnd="base">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Map Theme</div>
                <div style={{ color: '#6d7175', fontSize: '12px' }}>Visual style</div>
            </div>

            <div style={{ marginTop: '0px' }}>
                <s-select value={mapStyleName} onChange={(e: any) => onThemeChange(e.currentTarget.value)}>
                    {mapThemes.map((theme) => (
                        <s-option key={theme.name} value={theme.name}>
                            {theme.name}
                        </s-option>
                    ))}
                </s-select>
            </div>
        </s-stack>
    );
}
