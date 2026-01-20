export interface PhoneValidationResult {
    isValid: boolean;
    message?: string;
}

export function validatePhoneNumber(phone: string): PhoneValidationResult {
    if (!phone || !phone.trim()) {
        return { isValid: true }; // Phone is optional
    }

    // Remove all spaces, dashes, parentheses, and plus signs for validation
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

    // Check if it contains only digits after cleaning
    if (!/^\d+$/.test(cleaned)) {
        return {
            isValid: false,
            message: "Phone number can only contain digits, spaces, dashes, parentheses, and plus sign"
        };
    }

    // Check length (most phone numbers are between 10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
        return {
            isValid: false,
            message: "Phone number must be between 10-15 digits"
        };
    }

    return { isValid: true };
}