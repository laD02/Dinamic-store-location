export const markerStyles = [
    { name: "Neon Pulse", id: "neon", color: "#00F2FF" },
    { name: "Glass Drop", id: "glass", color: "#FFFFFF" },
    { name: "Gradient Pin", id: "gradient", color: "#FF3CAC" },
    { name: "Minimal Ring", id: "ring", color: "#323232" },
    { name: "Modern Square", id: "square", color: "#2E3192" },
    { name: "Radar Echo", id: "radar", color: "#F093FB" },
    { name: "Diamond", id: "diamond", color: "#5EE7DF" },
    { name: "Soft Glow", id: "glow", color: "#F5576C" },
    { name: "Pill Capsule", id: "pill", color: "#4FACFE" },
    { name: "Precision", id: "precision", color: "#43E97B" },
    { name: "Executive Pin", id: "executive", color: "#1A202C" },
    { name: "Luxe Hex", id: "luxehex", color: "#2D3748" },
    { name: "Urban Ring", id: "urban", color: "#4A5568" },
    { name: "Minimal Needle", id: "needle", color: "#718096" },
    { name: "Crystal Prism", id: "prism", color: "#A0AEC0" }
];

export const getMarkerSvg = (style: string, color: string = "#EA4335") => {
    let content = "";
    const viewBox = "0 0 40 40";

    switch (style) {
        case "neon":
            content = `
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <circle cx="20" cy="20" r="12" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.3" />
                <circle cx="20" cy="20" r="8" stroke="${color}" stroke-width="2" fill="none" filter="url(#glow)" />
                <circle cx="20" cy="20" r="4" fill="${color}" />
            `;
            break;
        case "glass":
            content = `
                <path d="M20 2C12.27 2 6 8.27 6 16C6 26.5 20 38 20 38C20 38 34 26.5 34 16C34 8.27 27.73 2 20 2Z" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.5" />
                <circle cx="20" cy="16" r="6" fill="${color}" fill-opacity="0.4" />
                <circle cx="20" cy="16" r="3" fill="${color}" />
            `;
            break;
        case "gradient":
            content = `
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#784BA0;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="M20 0C12.8 0 7 5.8 7 13C7 22.8 20 40 20 40C20 40 33 22.8 33 13C33 5.8 27.2 0 20 0Z" fill="url(#grad)" />
                <circle cx="20" cy="13" r="5" fill="white" fill-opacity="0.3" />
            `;
            break;
        case "ring":
            content = `
                <circle cx="20" cy="20" r="16" stroke="${color}" stroke-width="1" fill="none" />
                <circle cx="20" cy="20" r="11" stroke="${color}" stroke-width="2" fill="none" />
                <circle cx="20" cy="20" r="6" fill="${color}" />
            `;
            break;
        case "square":
            content = `
                <rect x="6" y="6" width="28" height="28" rx="8" fill="${color}" />
                <rect x="14" y="14" width="12" height="12" rx="3" fill="white" fill-opacity="0.3" />
                <path d="M20 34V38" stroke="${color}" stroke-width="2" stroke-linecap="round" />
            `;
            break;
        case "radar":
            content = `
                <circle cx="20" cy="20" r="4" fill="${color}" />
                <circle cx="20" cy="20" r="10" stroke="${color}" stroke-width="1.5" stroke-dasharray="2 2" fill="none" opacity="0.6" />
                <circle cx="20" cy="20" r="16" stroke="${color}" stroke-width="1" fill="none" opacity="0.3" />
            `;
            break;
        case "diamond":
            content = `
                <path d="M20 4L34 20L20 36L6 20L20 4Z" fill="${color}" />
                <path d="M20 12L28 20L20 28L12 20L20 12Z" fill="white" fill-opacity="0.3" />
                <circle cx="20" cy="20" r="3" fill="white" />
            `;
            break;
        case "glow":
            content = `
                <defs>
                    <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feOffset dx="0" dy="0" result="offsetBlur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.5" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <path d="M20 2C12.27 2 6 8.27 6 16C6 26.5 20 38 20 38C20 38 34 26.5 34 16C34 8.27 27.73 2 20 2Z" fill="${color}" filter="url(#outerGlow)" />
                <circle cx="20" cy="16" r="5" fill="white" fill-opacity="0.3" />
            `;
            break;
        case "pill":
            content = `
                <rect x="12" y="4" width="16" height="32" rx="8" fill="${color}" />
                <circle cx="20" cy="12" r="4" fill="white" fill-opacity="0.4" />
                <circle cx="20" cy="28" r="4" fill="white" fill-opacity="0.8" />
            `;
            break;
        case "precision":
            content = `
                <circle cx="20" cy="20" r="14" stroke="${color}" stroke-width="2" fill="none" />
                <path d="M20 2V10M20 30V38M2 20H10M30 20H38" stroke="${color}" stroke-width="2" stroke-linecap="round" />
                <circle cx="20" cy="20" r="4" fill="${color}" />
            `;
            break;
        case "executive":
            content = `
                <path d="M20 38C20 38 31 27 31 16C31 9.92487 26.0751 5 20 5C13.9249 5 9 9.92487 9 16C9 27 20 38 20 38Z" fill="${color}" stroke="white" stroke-width="1.5" />
                <circle cx="20" cy="16" r="3" fill="white" />
            `;
            break;
        case "luxehex":
            content = `
                <path d="M20 4L32 12V28L20 36L8 28V12L20 4Z" fill="${color}" />
                <path d="M20 10L26 14V26L20 30L14 26V14L20 10Z" fill="white" fill-opacity="0.2" />
                <circle cx="20" cy="20" r="2" fill="white" />
            `;
            break;
        case "urban":
            content = `
                <circle cx="20" cy="20" r="16" stroke="${color}" stroke-width="3" fill="none" />
                <circle cx="20" cy="20" r="10" stroke="${color}" stroke-width="1" fill="none" />
                <circle cx="20" cy="20" r="4" fill="${color}" />
            `;
            break;
        case "needle":
            content = `
                <rect x="19" y="10" width="2" height="26" rx="1" fill="${color}" />
                <circle cx="20" cy="10" r="6" fill="${color}" />
                <circle cx="20" cy="10" r="2" fill="white" />
            `;
            break;
        case "prism":
            content = `
                <path d="M20 6L34 34H6L20 6Z" fill="${color}" fill-opacity="0.8" />
                <path d="M20 6L20 34" stroke="white" stroke-opacity="0.3" />
                <path d="M20 18L28 34H12L20 18Z" fill="white" fill-opacity="0.2" />
            `;
            break;
        default:
            content = ``;
    }

    const svg = `
    <svg width="40" height="40" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" data-style="${style}" data-color="${color}">
        ${content}
    </svg>
    `.trim();
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const parseMarkerMetadata = (icon: string | null) => {
    if (!icon || (!icon.startsWith("data:image/svg+xml;base64,") && !icon.startsWith("data:image/svg+xml,"))) {
        return { styleId: null, color: null };
    }

    try {
        let svgString = "";
        if (icon.startsWith("data:image/svg+xml;base64,")) {
            const base64Data = icon.split(",")[1];
            svgString = atob(base64Data);
        } else {
            svgString = decodeURIComponent(icon.split(",")[1]);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svgElement = doc.documentElement;

        if (svgElement && svgElement.nodeName.toLowerCase() === 'svg') {
            return {
                styleId: svgElement.getAttribute("data-style"),
                color: svgElement.getAttribute("data-color")
            };
        }
    } catch (e) {
        console.error("Error parsing SVG metadata:", e);
    }
    return { styleId: null, color: null };
};
