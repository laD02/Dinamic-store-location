export interface WebsiteValidationResult {
    isValid: boolean;
    message?: string;
}

/**
 * Validates a website URL
 * @param url - The URL to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateWebsiteUrl(url: string): WebsiteValidationResult {
    // Allow empty URL
    if (!url || !url.trim()) {
        return {
            isValid: true
        };
    }

    const trimmedUrl = url.trim();

    // Basic URL pattern validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

    if (!urlPattern.test(trimmedUrl)) {
        return {
            isValid: false,
            message: "Please enter a valid URL (e.g., https://example.com)"
        };
    }

    // Check if protocol is present, if not, it's still valid but might want to warn
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        // This is valid, but you might want to auto-add https:// on the backend
        return {
            isValid: true
        };
    }

    // Check for common issues
    if (trimmedUrl.includes(' ')) {
        return {
            isValid: false,
            message: "URL cannot contain spaces"
        };
    }

    // Check for valid domain extension
    const domainMatch = trimmedUrl.match(/\.([a-z]{2,})(?:\/|$)/i);
    if (!domainMatch) {
        return {
            isValid: false,
            message: "URL must have a valid domain extension (e.g., .com, .net)"
        };
    }

    // All checks passed
    return {
        isValid: true
    };
}

/**
 * Normalizes a website URL by ensuring it has a protocol
 * @param url - The URL to normalize
 * @returns Normalized URL with protocol
 */
export function normalizeWebsiteUrl(url: string): string {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
        return '';
    }

    // Add https:// if no protocol is present
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        return `https://${trimmedUrl}`;
    }

    return trimmedUrl;
}

/**
 * Extracts domain name from URL for display purposes
 * @param url - The URL to extract domain from
 * @returns Domain name without protocol and path
 */
export function extractDomain(url: string): string {
    if (!url) return '';

    try {
        const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
        return urlObj.hostname;
    } catch {
        // If URL parsing fails, try to extract domain manually
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
        return match ? match[1] : url;
    }
}