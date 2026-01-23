// app/components/AddressAutocomplete.tsx
import { useEffect, useRef, useState } from "react";

interface AddressSuggestion {
    display_name: string
    name: string
    lat: string
    lon: string
    address: {
        house_number: string;
        road?: string
        city?: string;
        state?: string;
        country?: string;
        country_code?: string;
        postcode?: string;
    };
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
}

export function AddressAutocomplete({
    onSelect,
    defaultValue = "",
    error,
    onAddressChange,
    checkDirty
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [hasSearched, setHasSearched] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch suggestions from Nominatim
    const fetchSuggestions = async (query: string) => {
        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            setHasSearched(false);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        setHasSearched(false);

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=5&countrycodes=vn`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'StoreLocator/1.0',
                    'Accept-Language': 'vi,en'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data)
                setSuggestions(data);
                setHasSearched(true);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('❌ Error fetching suggestions:', error);
            setHasSearched(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input change with debounce
    const handleInputChange = (value: string) => {
        setInputValue(value);
        setActiveSuggestionIndex(-1);

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

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
        const isVietnam = suggestion.address.country === 'Việt Nam' ||
            suggestion.address.country === 'Vietnam' ||
            suggestion.address.country_code === 'vn';

        const city = isVietnam
            ? (suggestion.address.state || suggestion.address.city || '')
            : (suggestion.address.city || suggestion.address.state || '');

        const selectedData = {
            address: suggestion.name,
            city,
            code: suggestion.address.postcode || '',
            region: suggestion.address.country || '',
            lat: suggestion.lat,
            lon: suggestion.lon
        };

        setInputValue(suggestion.name);
        setShowSuggestions(false);
        setSuggestions([]);
        onSelect(selectedData);

        if (checkDirty) {
            checkDirty();
        }
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

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div onKeyDown={handleKeyDown}>
                <s-text-field
                    label="Address"
                    name="address"
                    required
                    error={error}
                    value={inputValue}
                    suffix={isLoading ? "Searching..." : undefined}
                    onInput={(e: any) => handleInputChange(e.target.value)}
                />
            </div>

            {showSuggestions && (suggestions.length > 0 || (hasSearched && !isLoading)) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        marginTop: '8px',
                        maxHeight: '320px',
                        overflowY: 'auto',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        padding: '6px'
                    }}
                >
                    {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    backgroundColor: index === activeSuggestionIndex ? '#f3f4f6' : 'transparent',
                                    borderRadius: '8px',
                                    transition: 'background-color 0.15s ease',
                                    border: index === activeSuggestionIndex ? '1px solid #e5e7eb' : '1px solid transparent'
                                }}
                                onMouseEnter={() => setActiveSuggestionIndex(index)}
                            >
                                <div style={{
                                    color: index === activeSuggestionIndex ? '#111827' : '#9ca3af',
                                    transition: 'color 0.15s'
                                }}>
                                    <i className="fa-solid fa-location-dot" style={{ fontSize: '16px' }}></i>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#374151',
                                        fontWeight: 500,
                                        marginBottom: '2px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {suggestion.display_name.split(',')[0]}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {suggestion.display_name}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : hasSearched && !isLoading ? (
                        <div
                            style={{
                                padding: '32px 16px',
                                textAlign: 'center',
                                color: '#6b7280'
                            }}
                        >
                            <i
                                className="fa-solid fa-magnifying-glass"
                                style={{
                                    fontSize: '20px',
                                    marginBottom: '12px',
                                    color: '#9ca3af',
                                    opacity: 0.8
                                }}
                            ></i>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                                No results found
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                                We couldn't find anything for "{inputValue}"
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}