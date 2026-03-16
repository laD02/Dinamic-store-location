import { useState } from "react";
import { mapThemes } from "../../utils/mapThemes";

interface MapThemeSectionProps {
    mapStyleName: string;
    onThemeChange: (themeName: string) => void;
    level: string;
}

export default function MapThemeSection({
    mapStyleName,
    onThemeChange,
    level
}: MapThemeSectionProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <s-stack gap="small" paddingBlockEnd="base">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Map Theme</div>
                <div style={{ color: '#6d7175', fontSize: '12px' }}>Visual style</div>
            </div>

            <div 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ 
                    marginTop: '0px',
                    transition: 'transform 200ms ease',
                    transform: isHovered ? 'translateY(-1px)' : 'translateY(0)'
                }}
            >
                <s-select value={mapStyleName} onChange={(e: any) => onThemeChange(e.currentTarget.value)}>
                    {mapThemes.filter(t => level !== 'basic' || t.name === "Standard").map((theme) => (
                        <s-option key={theme.name} value={theme.name}>
                            {theme.name}
                        </s-option>
                    ))}
                </s-select>
            </div>
        </s-stack>
    );
}
