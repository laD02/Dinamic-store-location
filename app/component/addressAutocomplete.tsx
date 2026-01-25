// app/components/AddressAutocomplete.tsx
import { useEffect, useRef, useState } from "react";
import styles from "../css/addressAutocomplete.module.css";

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
    onValidationChange?: (isValid: boolean) => void; // THÊM PROP MỚI
}

export function AddressAutocomplete({
    onSelect,
    defaultValue = "",
    error,
    onAddressChange,
    checkDirty,
    onValidationChange // THÊM PROP MỚI
}: AddressAutocompleteProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [hasSearched, setHasSearched] = useState(false);
    const [isAddressSelected, setIsAddressSelected] = useState(false); // THÊM STATE MỚI
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Đóng suggestions khi click ra ngoài
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

    // ... các useEffect khác ...

    // Fetch suggestions from Nominatim
    const fetchSuggestions = async (query: string) => {
        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            setHasSearched(false);
            setShowSuggestions(false);
            setIsAddressSelected(false); // RESET KHI XÓA INPUT
            onValidationChange?.(false); // BÁO KHÔNG HỢP LỆ
            return;
        }

        setIsLoading(true);
        setHasSearched(false);
        setIsAddressSelected(false); // RESET KHI TÌM KIẾM MỚI
        onValidationChange?.(false); // BÁO KHÔNG HỢP LỆ KHI ĐANG TÌM

        try {
            const encodedQuery = encodeURIComponent(query);
            const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=5`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'StoreLocator/1.0',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data)
                setSuggestions(data);
                setHasSearched(true);
                setShowSuggestions(true);

                // NẾU KHÔNG TÌM THẤY KẾT QUẢ
                if (data.length === 0) {
                    onValidationChange?.(false);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching suggestions:', error);
            setHasSearched(true);
            onValidationChange?.(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input change with debounce
    const handleInputChange = (value: string) => {
        setInputValue(value);
        setActiveSuggestionIndex(-1);
        setIsAddressSelected(false); // RESET KHI USER THAY ĐỔI INPUT
        onValidationChange?.(false); // BÁO KHÔNG HỢP LỆ

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
        setIsAddressSelected(true); // ĐÁNH DẤU ĐÃ CHỌN ĐỊA CHỈ
        onValidationChange?.(true); // BÁO HỢP LỆ
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
                />
            </div>

            {showSuggestions && (suggestions.length > 0 || (hasSearched && !isLoading)) && (
                <div className={styles.suggestionsContainer}>
                    {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className={`${styles.suggestionItem} ${index === activeSuggestionIndex ? styles.active : ''}`}
                                onMouseEnter={() => setActiveSuggestionIndex(index)}
                            >
                                <div className={styles.iconWrapper}>
                                    <i className="fa-solid fa-location-dot"></i>
                                </div>
                                <div className={styles.textContent}>
                                    <div className={styles.mainText}>
                                        {suggestion.display_name.split(',')[0]}
                                    </div>
                                    <div className={styles.subText}>
                                        {suggestion.display_name}
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
                </div>
            )}
        </div>
    );
}