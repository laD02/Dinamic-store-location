import { useEffect, useRef, useState } from "react";
import { mapThemes } from "app/utils/mapThemes";
import { getMarkerSvg, parseMarkerMetadata } from "app/utils/markerUtils";
import PremiumMarkerSection from "./branding/PremiumMarkerSection";
import CustomIconSection from "./branding/CustomIconSection";
import MapThemeSection from "./branding/MapThemeSection";

export default function MarkerBranding({
    onChange,
    config,
    onClosePickerRequest
}: {
    onChange: (branding: { markerIcon: string | null, mapStyle: string | null }) => void,
    config: { markerIcon: string | null, mapStyle: string | null },
    onClosePickerRequest?: boolean
}) {
    const [markerIcon, setMarkerIcon] = useState<string | null>(config?.markerIcon ?? null);
    const [mapStyleName, setMapStyleName] = useState<string>(
        mapThemes.find(t => JSON.stringify(t.style) === config?.mapStyle)?.name ?? "Standard"
    );
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [markerColor, setMarkerColor] = useState<string>("#EA4335");
    const [showColorPicker, setShowColorPicker] = useState(false);

    const isSyncingRef = useRef(false);

    // Close color picker on request
    useEffect(() => {
        setShowColorPicker(false);
    }, [onClosePickerRequest]);

    // Sync from config
    useEffect(() => {
        if (!config) return;
        isSyncingRef.current = true;

        const currentIcon = config.markerIcon;
        setMarkerIcon(currentIcon);

        const { styleId, color } = parseMarkerMetadata(currentIcon);
        setSelectedStyleId(styleId);
        if (color) setMarkerColor(color);

        const currentTheme = mapThemes.find(t => JSON.stringify(t.style) === config.mapStyle);
        setMapStyleName(currentTheme?.name ?? "Standard");

        setTimeout(() => { isSyncingRef.current = false; }, 0);
    }, [config]);

    // Notify changes upward
    useEffect(() => {
        if (isSyncingRef.current) return;
        const selectedTheme = mapThemes.find(t => t.name === mapStyleName);
        onChange({
            markerIcon,
            mapStyle: selectedTheme ? JSON.stringify(selectedTheme.style) : "[]"
        });
    }, [markerIcon, mapStyleName]);

    // Handle premium style selection/updates
    useEffect(() => {
        if (isSyncingRef.current) return;
        if (selectedStyleId) {
            const svgData = getMarkerSvg(selectedStyleId, markerColor);
            setMarkerIcon(svgData);
        }
    }, [selectedStyleId, markerColor]);

    const handleFileChange = (e: any) => {
        const files = e.target?.files || e.detail?.files || e.dataTransfer?.files;
        const file = files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMarkerIcon(reader.result as string);
                setSelectedStyleId(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStyleSelect = (styleId: string, defaultColor: string) => {
        setSelectedStyleId(styleId);
        setMarkerColor(defaultColor);
    };

    const handleRemovePremium = () => {
        setSelectedStyleId(null);
        setMarkerIcon(null);
    };

    const handleRemoveCustom = () => {
        setMarkerIcon(null);
        setSelectedStyleId(null);
    };

    return (
        <s-stack gap="base" paddingBlockStart="base">
            <PremiumMarkerSection
                selectedStyleId={selectedStyleId}
                markerColor={markerColor}
                onStyleSelect={handleStyleSelect}
                onColorChange={setMarkerColor}
                onRemove={handleRemovePremium}
                showColorPicker={showColorPicker}
                setShowColorPicker={setShowColorPicker}
            />

            <div style={{ height: '1px', background: '#f4f6f8', width: '100%', margin: '4px 0' }} />

            <CustomIconSection
                markerIcon={markerIcon}
                selectedStyleId={selectedStyleId}
                onFileChange={handleFileChange}
                onRemove={handleRemoveCustom}
            />

            <div style={{ height: '1px', background: '#f4f6f8', width: '100%', margin: '4px 0' }} />

            <MapThemeSection
                mapStyleName={mapStyleName}
                onThemeChange={setMapStyleName}
            />
        </s-stack>
    );
}
