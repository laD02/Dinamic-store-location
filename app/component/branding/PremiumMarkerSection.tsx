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
}

export default function PremiumMarkerSection({
    selectedStyleId,
    markerColor,
    onStyleSelect,
    onColorChange,
    onRemove,
    showColorPicker,
    setShowColorPicker
}: PremiumMarkerSectionProps) {
    const colorPickerRef = useRef<HTMLDivElement | null>(null);

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
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '6px',
                background: '#fcfcfc',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
            }}>
                {markerStyles.map((style) => {
                    const isSelected = selectedStyleId === style.id;
                    const previewSvg = getMarkerSvg(style.id, isSelected ? markerColor : style.color);

                    return (
                        <div
                            key={style.id}
                            onClick={() => onStyleSelect(style.id, style.color)}
                            style={{
                                cursor: 'pointer',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: isSelected ? '1px solid #008060' : '1px solid transparent',
                                background: isSelected ? '#f6fdf9' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 150ms ease',
                                boxShadow: isSelected ? '0 1px 4px rgba(0,128,96,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
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
                                padding: '2px'
                            }}>
                                <img src={previewSvg} alt={style.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: isSelected ? '#008060' : '#4a5568',
                                fontWeight: isSelected ? '600' : '500',
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
