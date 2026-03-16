import { useRef, useState, useEffect } from "react";
import { markerStyles, getMarkerSvg } from "../../utils/markerUtils";

interface PremiumMarkerSectionProps {
    selectedStyleId: string | null;
    markerColor: string;
    onStyleSelect: (styleId: string, defaultColor: string) => void;
    onColorChange: (color: string) => void;
    onRemove: () => void;
    showColorPicker: boolean;
    setShowColorPicker: (show: boolean) => void;
    level: string;
}

export default function PremiumMarkerSection({
    selectedStyleId,
    markerColor,
    onStyleSelect,
    onColorChange,
    onRemove,
    showColorPicker,
    setShowColorPicker,
    level
}: PremiumMarkerSectionProps) {
    const colorPickerRef = useRef<HTMLDivElement | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showColorPicker, setShowColorPicker]);

    return (
        <s-stack gap="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Premium Markers</div>
                    {selectedStyleId && (
                        <s-button
                            variant="tertiary"
                            tone="critical"
                            onClick={onRemove}
                        >
                            Clear
                        </s-button>
                    )}
                </div>
                <div style={{ color: '#6d7175', fontSize: '12px' }}>Curated designs</div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                padding: '6px',
                background: '#fcfcfc',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
            }}>
                {markerStyles.map((style) => {
                    const isSelected = selectedStyleId === style.id;
                    const isHovered = hoveredId === style.id;
                    const previewSvg = getMarkerSvg(style.id, isSelected ? markerColor : style.color);

                    return (
                        <div
                            key={style.id}
                            onMouseEnter={() => level !== 'basic' && setHoveredId(style.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => {
                                if (level === 'basic') return;
                                onStyleSelect(style.id, style.color);
                            }}
                            style={{
                                cursor: level === 'basic' ? 'not-allowed' : 'pointer',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                border: isSelected ? '1px solid #005bd3' : (isHovered ? '1px solid #b3d1ff' : '1px solid transparent'),
                                background: isSelected ? '#f1f7ff' : (isHovered ? '#f9fbff' : '#ffffff'),
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isSelected ? '0 2px 6px rgba(0,91,211,0.15)' : (isHovered ? '0 2px 4px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.04)'),
                                transform: isHovered ? 'translateY(-1px) scale(1.02)' : 'translateY(0) scale(1)',
                                height: '100%',
                                boxSizing: 'border-box',
                                filter: level === 'basic' ? 'grayscale(1)' : 'none',
                                opacity: level === 'basic' ? 0.6 : 1,
                                zIndex: isHovered ? 1 : 0
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: style.id === 'glass' || style.id === 'executive' ? '#202223' : 'transparent',
                                borderRadius: '4px',
                                padding: '2px',
                                flexShrink: 0,
                                transition: 'transform 200ms ease',
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)'
                            }}>
                                <img src={previewSvg} alt={style.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{
                                fontSize: '11px',
                                color: isSelected || isHovered ? '#005bd3' : '#4a5568',
                                fontWeight: isSelected || isHovered ? '600' : '500',
                                lineHeight: '1.2',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transition: 'color 200ms ease'
                            }}>{style.name}</div>
                        </div>
                    );
                })}
            </div>

            {selectedStyleId && (
                <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: '500' }}>Marker Color:</div>
                        <div style={{ position: 'relative' }} ref={colorPickerRef}>
                            <div
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '4px',
                                    backgroundColor: markerColor,
                                    border: '1px solid #d2d5d8',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                            />
                            {showColorPicker && (
                                <div style={{
                                    position: 'absolute',
                                    zIndex: 100,
                                    bottom: '100%',
                                    left: 0,
                                    marginBottom: '8px',
                                    background: '#fff',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    border: '1px solid #e1e3e5'
                                }}>
                                    <s-color-picker
                                        value={markerColor}
                                        alpha
                                        onInput={(e: any) => onColorChange(e.currentTarget.value)}
                                        onChange={(e: any) => onColorChange(e.currentTarget.value)}
                                    />
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '11px',
                                        color: '#6d7175',
                                        textAlign: 'center',
                                        padding: '4px 0',
                                        borderTop: '1px solid #f0f0f0'
                                    }}>
                                        {markerColor.toUpperCase()}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6d7175' }}>{markerColor}</div>
                    </div>
                </div>
            )}
        </s-stack>
    );
}
