// Social Media URL Validation

export type SocialPlatform =
    | "facebook"
    | "youtube"
    | "linkedin"
    | "instagram"
    | "x"
    | "pinterest"
    | "tiktok";

export interface SocialValidationError {
    [key: string]: string;
}

// Regex patterns cho từng platform
const socialPatterns: Record<SocialPlatform, RegExp> = {
    facebook: /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/i,
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in|company|school)\/.+/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i,
    x: /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/.+/i,
    pinterest: /^https?:\/\/(www\.)?pinterest\.com\/.+/i,
    tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@.+/i,
};

// Error messages cho từng platform
const errorMessages: Record<SocialPlatform, string> = {
    facebook: "Please enter a valid Facebook URL (e.g., https://facebook.com/yourpage)",
    youtube: "Please enter a valid YouTube URL (e.g., https://youtube.com/channel/...)",
    linkedin: "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/profile)",
    instagram: "Please enter a valid Instagram URL (e.g., https://instagram.com/username)",
    x: "Please enter a valid X/Twitter URL (e.g., https://x.com/username)",
    pinterest: "Please enter a valid Pinterest URL (e.g., https://pinterest.com/username)",
    tiktok: "Please enter a valid TikTok URL (e.g., https://tiktok.com/@username)",
};

/**
 * Validate một social media URL theo platform
 */
export function validateSocialUrl(
    url: string,
    platform: SocialPlatform
): { valid: boolean; error?: string } {
    // Nếu URL trống, không báo lỗi (cho phép để trống)
    if (!url || url.trim() === "") {
        return { valid: true };
    }

    const pattern = socialPatterns[platform];
    const isValid = pattern.test(url.trim());

    if (!isValid) {
        return {
            valid: false,
            error: errorMessages[platform],
        };
    }

    return { valid: true };
}

/**
 * Validate tất cả social media URLs trong một mảng
 */
export function validateAllSocialUrls(
    socials: Array<{ id: string; platform: SocialPlatform; url: string }>
): SocialValidationError {
    const errors: SocialValidationError = {};

    socials.forEach((social) => {
        const result = validateSocialUrl(social.url, social.platform);
        if (!result.valid && result.error) {
            errors[social.id] = result.error;
        }
    });

    return errors;
}

/**
 * Kiểm tra xem URL có match với platform không
 * Dùng để warning khi user chọn sai platform
 */
export function detectPlatformFromUrl(url: string): SocialPlatform | null {
    if (!url || url.trim() === "") return null;

    const trimmedUrl = url.trim().toLowerCase();

    if (trimmedUrl.includes("facebook.com") || trimmedUrl.includes("fb.com")) {
        return "facebook";
    }
    if (trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be")) {
        return "youtube";
    }
    if (trimmedUrl.includes("linkedin.com")) {
        return "linkedin";
    }
    if (trimmedUrl.includes("instagram.com")) {
        return "instagram";
    }
    if (trimmedUrl.includes("x.com") || trimmedUrl.includes("twitter.com")) {
        return "x";
    }
    if (trimmedUrl.includes("pinterest.com")) {
        return "pinterest";
    }
    if (trimmedUrl.includes("tiktok.com")) {
        return "tiktok";
    }

    return null;
}

/**
 * Kiểm tra URL có match với platform đã chọn không
 */
export function isPlatformMismatch(
    url: string,
    selectedPlatform: SocialPlatform
): boolean {
    const detectedPlatform = detectPlatformFromUrl(url);

    if (!detectedPlatform) return false;

    return detectedPlatform !== selectedPlatform;
}

/**
 * Format URL để đảm bảo có protocol
 */
export function formatSocialUrl(url: string): string {
    if (!url || url.trim() === "") return "";

    const trimmed = url.trim();

    // Nếu đã có protocol, return as is
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    // Thêm https:// nếu chưa có
    return `https://${trimmed}`;
}