// app/utils/timeValidation.ts

/**
 * Check if string contains any letters
 */
export const containsLetters = (value: string): boolean => {
    return /[a-zA-Z]/.test(value);
};

/**
 * Validate time format HH:MM (00:00 - 23:59)
 */
export const validateTimeFormat = (time: string): boolean => {
    if (!time || time === "close") return true;

    // Reject if contains letters
    if (containsLetters(time)) return false;

    // Strict HH:MM format
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    return timeRegex.test(time);
};

/**
 * Format time input - auto add ':' after HH
 * NOTE: Do NOT remove letters, let validator catch them
 */
export const formatTimeInput = (value: string): string => {
    // Shopify-style:
    // Không chỉnh sửa input khi user đang gõ
    // Giữ nguyên để SaveBar detect dirty state
    return value ?? '';
};


/**
 * Validate if close time is after open time
 */
export const validateTimeRange = (
    openTime: string,
    closeTime: string
): boolean => {
    if (
        !openTime ||
        !closeTime ||
        openTime === "close" ||
        closeTime === "close"
    ) {
        return true;
    }

    if (
        !validateTimeFormat(openTime) ||
        !validateTimeFormat(closeTime)
    ) {
        return false;
    }

    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const openInMinutes = openHour * 60 + openMin;
    const closeInMinutes = closeHour * 60 + closeMin;

    return closeInMinutes > openInMinutes;
};

/**
 * Type definition for time errors
 */
export type TimeErrors = Record<
    string,
    { open?: string; close?: string }
>;

/**
 * Validate all day times
 */
export const validateAllTimes = (
    dayStatus: Record<
        string,
        { valueOpen: string; valueClose: string }
    >,
    days: string[]
): TimeErrors => {
    const errors: TimeErrors = {};

    days.forEach(day => {
        const { valueOpen, valueClose } = dayStatus[day];

        // Skip closed day
        if (valueOpen === "close" || valueClose === "close") return;

        // Letter validation
        if (valueOpen && containsLetters(valueOpen)) {
            errors[day] = { ...errors[day], open: 'Time must contain only numbers' };
        }

        if (valueClose && containsLetters(valueClose)) {
            errors[day] = { ...errors[day], close: 'Time must contain only numbers' };
        }

        // Format validation
        if (valueOpen && !validateTimeFormat(valueOpen)) {
            errors[day] = { ...errors[day], open: 'Invalid time format (HH:MM)' };
        }

        if (valueClose && !validateTimeFormat(valueClose)) {
            errors[day] = { ...errors[day], close: 'Invalid time format (HH:MM)' };
        }

        // Range validation
        if (
            valueOpen &&
            valueClose &&
            validateTimeFormat(valueOpen) &&
            validateTimeFormat(valueClose) &&
            !validateTimeRange(valueOpen, valueClose)
        ) {
            errors[day] = {
                ...errors[day],
                close: 'Close time must be after open time'
            };
        }
    });

    return errors;
};
