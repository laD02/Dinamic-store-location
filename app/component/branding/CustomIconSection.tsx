import { useState } from "react";

interface CustomIconSectionProps {
    markerIcon: string | null;
    selectedStyleId: string | null;
    onFileChange: (e: any) => void;
    onRemove: () => void;
    level: string;
}

export default function CustomIconSection({
    markerIcon,
    selectedStyleId,
    onFileChange,
    onRemove,
    level
}: CustomIconSectionProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <s-stack gap="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Custom Icon</div>
                <div style={{ color: '#6d7175', fontSize: '12px' }}>Bespoke upload</div>
            </div>

            <div style={{ marginTop: '0px' }}>
                {(!markerIcon || selectedStyleId) ? (
                    <div 
                        onMouseEnter={() => level !== 'basic' && setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{
                            border: isHovered ? '1px dashed #005bd3' : '1px dashed #d2d5d8',
                            borderRadius: '6px',
                            background: isHovered ? '#f9fbff' : '#fafbfb',
                            transition: 'all 200ms ease',
                            padding: '10px',
                            cursor: level === 'basic' ? 'not-allowed' : 'pointer',
                            opacity: level === 'basic' ? 0.6 : 1,
                            filter: level === 'basic' ? 'grayscale(1)' : 'none',
                            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                            boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        <s-drop-zone
                            accessibilityLabel="Upload custom marker icon"
                            accept="image/*"
                            onChange={(e: any) => {
                                if (level === 'basic') return;
                                onFileChange(e);
                            }}
                            onInput={(e: any) => {
                                if (level === 'basic') return;
                                onFileChange(e);
                            }}
                        />
                    </div>
                ) : (
                    <div 
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: isHovered ? '#f9fbff' : '#fcfcfc',
                            border: isHovered ? '1px solid #b3d1ff' : '1px solid #f0f0f0',
                            borderRadius: '8px',
                            transition: 'all 200ms ease',
                            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                border: isHovered ? '1px solid #005bd3' : '1px solid #e1e3e5',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#ffffff',
                                padding: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                transition: 'all 200ms ease',
                                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                            }}>
                                <img src={markerIcon} alt="Custom Marker" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                fontWeight: '500', 
                                color: isHovered ? '#005bd3' : '#202223',
                                transition: 'color 200ms ease'
                            }}>Active Asset</div>
                        </div>
                        <s-button
                            variant="tertiary"
                            tone="critical"
                            onClick={onRemove}
                        >
                            Clear
                        </s-button>
                    </div>
                )}
            </div>
        </s-stack>
    );
}
