interface CustomIconSectionProps {
    markerIcon: string | null;
    selectedStyleId: string | null;
    onFileChange: (e: any) => void;
    onRemove: () => void;
}

export default function CustomIconSection({
    markerIcon,
    selectedStyleId,
    onFileChange,
    onRemove
}: CustomIconSectionProps) {
    return (
        <s-stack gap="small">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>Custom Icon</div>
                <div style={{ color: '#6d7175', fontSize: '12px' }}>Bespoke upload</div>
            </div>

            <div style={{ marginTop: '0px' }}>
                {(!markerIcon || selectedStyleId) ? (
                    <div style={{
                        border: '1px dashed #d2d5d8',
                        borderRadius: '6px',
                        background: '#fafbfb',
                        transition: 'all 0.15s',
                        padding: '10px',
                        cursor: 'pointer'
                    }}>
                        <s-drop-zone
                            accessibilityLabel="Upload custom marker icon"
                            accept="image/*"
                            onChange={onFileChange}
                            onInput={onFileChange}
                        />
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#fcfcfc',
                        border: '1px solid #f0f0f0',
                        borderRadius: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                border: '1px solid #e1e3e5',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#ffffff',
                                padding: '4px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}>
                                <img src={markerIcon} alt="Custom Marker" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#202223' }}>Active Asset</div>
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
