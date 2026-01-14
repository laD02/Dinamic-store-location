// utils/socialValidation.ts

export type SocialPlatform = 'facebook' | 'youtube' | 'linkedin' | 'instagram' | 'x' | 'pinterest' | 'tiktok';

export interface ValidationResult {
    isValid: boolean;
    message?: string;
}

export interface SocialMediaError {
    [id: string]: string;
}

// Regex patterns cho từng platform
const SOCIAL_PATTERNS: Record<SocialPlatform, RegExp> = {
    facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+$/i,
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+$/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+$/i,
    x: /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/.+$/i,
    pinterest: /^https?:\/\/(www\.)?pinterest\.com\/.+$/i,
    tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+$/i,
};

// Friendly names cho error messages
const PLATFORM_NAMES: Record<SocialPlatform, string> = {
    facebook: 'Facebook',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    x: 'X (Twitter)',
    pinterest: 'Pinterest',
    tiktok: 'TikTok',
};

// Example URLs cho từng platform
const EXAMPLE_URLS: Record<SocialPlatform, string> = {
    facebook: 'https://www.facebook.com/yourpage',
    youtube: 'https://www.youtube.com/channel/yourchannel',
    linkedin: 'https://www.linkedin.com/company/yourcompany',
    instagram: 'https://www.instagram.com/yourusername',
    x: 'https://www.x.com/yourusername',
    pinterest: 'https://www.pinterest.com/yourusername',
    tiktok: 'https://www.tiktok.com/@yourusername',
};

/**
 * Validate URL cho social media platform
 */
export function validateSocialUrl(url: string, platform: SocialPlatform): ValidationResult {
    // Kiểm tra URL rỗng
    if (!url || url.trim() === '') {
        return {
            isValid: false,
            message: 'URL is required',
        };
    }

    // Kiểm tra URL có phải https/http không
    if (!url.match(/^https?:\/\//i)) {
        return {
            isValid: false,
            message: 'URL must start with http:// or https://',
        };
    }

    // Kiểm tra pattern của platform
    const pattern = SOCIAL_PATTERNS[platform];
    if (!pattern.test(url)) {
        return {
            isValid: false,
            message: `Invalid ${PLATFORM_NAMES[platform]} URL. Example: ${EXAMPLE_URLS[platform]}`,
        };
    }

    return { isValid: true };
}

/**
 * Detect platform từ URL
 */
export function detectPlatformFromUrl(url: string): SocialPlatform | null {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com')) {
        return 'facebook';
    }
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return 'youtube';
    }
    if (lowerUrl.includes('linkedin.com')) {
        return 'linkedin';
    }
    if (lowerUrl.includes('instagram.com')) {
        return 'instagram';
    }
    if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com')) {
        return 'x';
    }
    if (lowerUrl.includes('pinterest.com')) {
        return 'pinterest';
    }
    if (lowerUrl.includes('tiktok.com')) {
        return 'tiktok';
    }

    return null;
}

/**
 * Get placeholder URL cho platform
 */
export function getPlaceholderUrl(platform: SocialPlatform): string {
    return EXAMPLE_URLS[platform];
}