export interface WebsiteValidationResult {
    isValid: boolean;
    message?: string;
}

/**
 * Validates a website URL with strict protocol checking
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

    // Check for spaces
    if (trimmedUrl.includes(' ')) {
        return {
            isValid: false,
            message: "URLs must not contain spaces."
        };
    }

    // STRICT: Must have proper protocol format (http:// or https://)
    const protocolRegex = /^(https?):\/\//i;
    const hasValidProtocol = protocolRegex.test(trimmedUrl);

    if (!hasValidProtocol) {
        return {
            isValid: false,
            message: "URLs must begin with http:// or https://"
        };
    }

    // Extract URL parts
    let urlToValidate = trimmedUrl.replace(protocolRegex, '');

    // Check if empty after removing protocol
    if (!urlToValidate) {
        return {
            isValid: false,
            message: "Invalid URL (e.g., https://example.com)"
        };
    }

    // Remove www. for validation (optional subdomain)
    const hasWww = urlToValidate.startsWith('www.');
    if (hasWww) {
        urlToValidate = urlToValidate.substring(4);
    }

    // Check if empty after removing www
    if (!urlToValidate) {
        return {
            isValid: false,
            message: "Invalid URL (e.g., https://www.example.com)"
        };
    }

    // Extract domain part (before first / ? or #)
    const domainMatch = urlToValidate.match(/^([^\/\?#:]+)/);
    if (!domainMatch) {
        return {
            isValid: false,
            message: "Invalid domain"
        };
    }

    const domain = domainMatch[1];

    // Check for IP address (basic validation)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(domain)) {
        // Validate IP octets
        const octets = domain.split('.');
        for (const octet of octets) {
            const num = parseInt(octet);
            if (num < 0 || num > 255) {
                return {
                    isValid: false,
                    message: "Invalid IP address"
                };
            }
        }
        return { isValid: true }; // Valid IP
    }

    // Domain must contain at least one dot (for regular domains)
    if (!domain.includes('.')) {
        return {
            isValid: false,
            message: "Domains must have an extension (e.g., .com, .vn)."
        };
    }

    // Split domain into parts
    const domainParts = domain.split('.');

    // Must have at least 2 parts (domain + TLD)
    if (domainParts.length < 2) {
        return {
            isValid: false,
            message: "Domains must have an extension (e.g., .com, .vn)."
        };
    }

    // Get TLD (last part)
    const tld = domainParts[domainParts.length - 1];

    // TLD must be at least 2 characters and only letters
    if (!/^[a-zA-Z]{2,}$/.test(tld)) {
        return {
            isValid: false,
            message: "Domains must have an extension (e.g., .com, .vn)."
        };
    }

    // Get domain name (second to last part)
    const domainName = domainParts[domainParts.length - 2];

    // Domain name must not be empty and contain valid characters
    // Allow alphanumeric and hyphens, but not starting/ending with hyphen
    if (!domainName || !/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/.test(domainName)) {
        return {
            isValid: false,
            message: "Invalid domain name"
        };
    }

    // Validate subdomains if any
    for (let i = 0; i < domainParts.length - 2; i++) {
        const subdomain = domainParts[i];
        if (!subdomain || !/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/.test(subdomain)) {
            return {
                isValid: false,
                message: "Invalid subdomain"
            };
        }
    }

    // Check port if exists (after domain, before path)
    const portMatch = urlToValidate.match(/^[^\/\?#]+:(\d+)/);
    if (portMatch) {
        const port = parseInt(portMatch[1]);
        if (port < 1 || port > 65535) {
            return {
                isValid: false,
                message: "The port number must be from 1 to 65535."
            };
        }
    }

    // Optional: Validate path characters (basic check)
    const pathMatch = urlToValidate.match(/\/([^\?#]*)/);
    if (pathMatch) {
        const path = pathMatch[1];
        // Check for obviously invalid characters in path
        if (/[\s<>"]/.test(path)) {
            return {
                isValid: false,
                message: "The URL contains invalid characters."
            };
        }
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
        const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s:?#]+)/i);
        return match ? match[1] : url;
    }
}

/**
 * Test examples
 */
export function testValidation() {
    const testCases = [
        { url: 'https://www.youtube.com/', expected: true },
        { url: 'http://example.com', expected: true },
        { url: 'https://sub.domain.com/path', expected: true },
        { url: 'httpswww.facebo', expected: false }, // Missing ://
        { url: 'www.facebook.com', expected: false }, // Missing protocol
        { url: 'https://facebook', expected: false }, // Missing TLD
        { url: 'https://', expected: false }, // Empty domain
        { url: '', expected: true }, // Empty allowed
        { url: 'https://192.168.1.1', expected: true }, // IP address
        { url: 'https://example.com:8080', expected: true }, // With port
    ];

    console.log('Kết quả test:');
    testCases.forEach(({ url, expected }) => {
        const result = validateWebsiteUrl(url);
        const status = result.isValid === expected ? '✓' : '✗';
        console.log(`${status} "${url}" => ${result.isValid ? 'VALID' : 'INVALID'} ${result.message || ''}`);
    });
}