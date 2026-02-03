// app/components/AddressAutocomplete.tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../css/addressAutocomplete.module.css";

interface AddressSuggestion {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

interface AddressAutocompleteProps {
    onSelect: (data: {
        address: string;
        city: string;
        code: string;
        region: string;
        lat: string;
        lon: string;
    }) => void;
    defaultValue?: string;
    error?: string;
    onAddressChange?: (value: string) => void;
    checkDirty?: () => void;
    onValidationChange?: (isValid: boolean) => void;
    googleMapsApiKey: string;
}

export function AddressAutocomplete({
    onSelect,
    defaultValue = "",
    error,
    onAddressChange,
    checkDirty,
    onValidationChange,
    googleMapsApiKey
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [hasSearched, setHasSearched] = useState(false);
    const [isAddressSelected, setIsAddressSelected] = useState(false);
    const [sessionToken, setSessionToken] = useState<string>("");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Generate session token
    useEffect(() => {
        const generateToken = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        setSessionToken(generateToken());
    }, []);

    // Close suggestions when click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch suggestions using New Places API
    const fetchSuggestions = async (query: string) => {

        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            setHasSearched(false);
            setShowSuggestions(false);
            setIsAddressSelected(false);
            onValidationChange?.(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(false);
        setIsAddressSelected(false);
        onValidationChange?.(false);

        try {

            const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': googleMapsApiKey
                },
                body: JSON.stringify({
                    input: query,
                    includedPrimaryTypes: ['street_address', 'premise', 'subpremise'],
                    sessionToken: sessionToken,
                })
            });

            const data = await response.json();

            setIsLoading(false);
            setHasSearched(true);

            if (data.suggestions && data.suggestions.length > 0) {

                const formattedSuggestions: AddressSuggestion[] = data.suggestions.map((suggestion: any) => {
                    const placePrediction = suggestion.placePrediction;
                    return {
                        placeId: placePrediction.placeId,
                        description: placePrediction.text.text,
                        mainText: placePrediction.structuredFormat.mainText.text,
                        secondaryText: placePrediction.structuredFormat.secondaryText?.text || ""
                    };
                });

                setSuggestions(formattedSuggestions);
                setShowSuggestions(true);
                onValidationChange?.(false);
            } else {
                setSuggestions([]);
                setShowSuggestions(true);
                onValidationChange?.(false);
            }
        } catch (error) {
            setIsLoading(false);
            setHasSearched(true);
            setSuggestions([]);
            onValidationChange?.(false);
        }
    };

    // Handle input change with debounce
    const handleInputChange = (value: string) => {
        setInputValue(value);
        setActiveSuggestionIndex(-1);
        setIsAddressSelected(false);
        onValidationChange?.(false);

        if (value.trim().length === 0) {
            setShowSuggestions(false);
        }

        if (onAddressChange) {
            onAddressChange(value);
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            fetchSuggestions(value);
        }, 500);
    };

    // Get place details using New Places API
    // Get place details using New Places API
    // Get place details using New Places API
    const getPlaceDetails = async (placeId: string, description: string) => {
        try {
            const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': googleMapsApiKey,
                    'X-Goog-FieldMask': 'id,displayName,formattedAddress,addressComponents,location',
                }
            });

            const data = await response.json();

            if (data && data.addressComponents) {
                let streetNumber = "";
                let route = "";
                let city = "";
                let state = "";
                let country = "";
                let postalCode = "";
                let premise = "";
                let subpremise = "";

                data.addressComponents.forEach((component: any) => {
                    const types = component.types;

                    if (types.includes("street_number")) {
                        streetNumber = component.longText;
                    }
                    if (types.includes("route")) {
                        route = component.longText;
                    }
                    if (types.includes("premise")) {
                        premise = component.longText;
                    }
                    if (types.includes("subpremise")) {
                        subpremise = component.longText;
                    }
                    if (types.includes("locality")) {
                        city = component.longText;
                    }
                    if (types.includes("administrative_area_level_1")) {
                        state = component.longText;
                    }
                    if (types.includes("country")) {
                        country = component.longText;
                    }
                    if (types.includes("postal_code")) {
                        postalCode = component.longText;
                    }
                });

                // Xây dựng địa chỉ theo thứ tự ưu tiên
                let fullAddress = "";

                // 1. Ưu tiên displayName nếu có (tên địa điểm)
                if (data.displayName?.text) {
                    fullAddress = data.displayName.text;
                }
                // 2. Nếu có premise (tên tòa nhà/khu phức hợp)
                else if (premise) {
                    fullAddress = premise;
                    if (subpremise) {
                        fullAddress = `${subpremise}, ${fullAddress}`;
                    }
                }
                // 3. Nếu không có premise, dùng street_number + route
                else if (streetNumber || route) {
                    fullAddress = `${streetNumber} ${route}`.trim();
                }
                // 4. Nếu không có gì, lấy phần đầu tiên của description
                else {
                    fullAddress = description.split(',')[0].trim();
                }

                // For Vietnam, city is usually the province/state
                const isVietnam = country === "Vietnam" || country === "Việt Nam";
                const finalCity = isVietnam ? state : city;

                const selectedData = {
                    address: fullAddress,
                    city: finalCity || city || state,
                    code: postalCode,
                    region: country,
                    lat: data.location.latitude.toString(),
                    lon: data.location.longitude.toString()
                };

                setInputValue(fullAddress);
                setShowSuggestions(false);
                setSuggestions([]);
                setIsAddressSelected(true);
                onValidationChange?.(true);
                onSelect(selectedData);

                // Generate new session token for next search
                const newToken = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                setSessionToken(newToken);

                if (checkDirty) {
                    checkDirty();
                }
            } else {
                console.error("❌ Invalid place details response");
            }
        } catch (error) {
            console.error('❌ Error getting place details:', error);
        }
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
        getPlaceDetails(suggestion.placeId, suggestion.description);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveSuggestionIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (activeSuggestionIndex >= 0) {
                    handleSelectSuggestion(suggestions[activeSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                break;
        }
    };

    // Calculate position for portal
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        if (showSuggestions && wrapperRef.current) {
            const updatePosition = () => {
                const rect = wrapperRef.current?.getBoundingClientRect();
                if (rect) {
                    setCoords({
                        top: rect.bottom + window.scrollY + 8,
                        left: rect.left + window.scrollX,
                        width: rect.width
                    });
                }
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [showSuggestions]);

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <div onKeyDown={handleKeyDown}>
                <s-text-field
                    label="Address"
                    name="address"
                    required
                    error={error}
                    value={inputValue}
                    suffix={isLoading ? "Searching..." : undefined}
                    onInput={(e: any) => handleInputChange(e.target.value)}
                    onBlur={() => setShowSuggestions(false)}
                />
            </div>

            {showSuggestions && (suggestions.length > 0 || (hasSearched && !isLoading)) && createPortal(
                <div
                    className={styles.suggestionsContainer}
                    style={{
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        position: 'absolute'
                    }}
                >
                    {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion.placeId}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectSuggestion(suggestion);
                                }}
                                className={`${styles.suggestionItem} ${index === activeSuggestionIndex ? styles.active : ''}`}
                                onMouseEnter={() => setActiveSuggestionIndex(index)}
                            >
                                <div className={styles.iconWrapper}>
                                    <i className="fa-solid fa-location-dot"></i>
                                </div>
                                <div className={styles.textContent}>
                                    <div className={styles.mainText}>
                                        {suggestion.mainText}
                                    </div>
                                    <div className={styles.subText}>
                                        {suggestion.secondaryText || suggestion.description}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : hasSearched && !isLoading ? (
                        <div className={styles.emptyState}>
                            <i className={`fa-solid fa-magnifying-glass ${styles.emptyIcon}`}></i>
                            <div className={styles.emptyTitle}>
                                No results found
                            </div>
                            <div className={styles.emptyDescription}>
                                We couldn't find anything for "{inputValue}"
                            </div>
                        </div>
                    ) : null}
                </div>,
                document.body
            )}
        </div>
    );
}