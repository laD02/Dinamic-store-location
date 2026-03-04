interface ConversionProps {
    viewCount: number;
    callCount: number;
    directionCount: number;
    websiteCount: number;
}

const CONVERSION_METRICS = [
    { key: "callCount" as const, label: "Phone", heading: "Phone Conversion", icon: "📞", color: "#10b981" },
    { key: "directionCount" as const, label: "Directions", heading: "Direction Conversion", icon: "🗺", color: "#ef4444" },
    { key: "websiteCount" as const, label: "Website", heading: "Website Conversion", icon: "🌐", color: "#8b5cf6" },
];

function getTier(rate: number) {
    if (rate >= 60) return { label: "Excellent", bg: "#dcfce7", text: "#16a34a" };
    if (rate >= 40) return { label: "Good", bg: "#fef9c3", text: "#ca8a04" };
    if (rate >= 20) return { label: "Average", bg: "#fff7ed", text: "#ea580c" };
    return { label: "Low", bg: "#fef2f2", text: "#dc2626" };
}

export default function Conversion({ viewCount, callCount, directionCount, websiteCount }: ConversionProps) {
    const views = viewCount || 0;

    const metrics = [
        { ...CONVERSION_METRICS[0], value: callCount },
        { ...CONVERSION_METRICS[1], value: directionCount },
        { ...CONVERSION_METRICS[2], value: websiteCount },
    ];

    const R = 44;
    const CIRCUMFERENCE = 2 * Math.PI * R;

    return (
        <s-query-container>
            <s-grid gridTemplateColumns='@container (inline-size > 768px) 1fr 1fr 1fr, 1fr' gap="base">
                {metrics.map((m) => {
                    const rate = views > 0 ? Math.min((m.value / views) * 100, 100) : 0;
                    const rateStr = rate.toFixed(1);
                    const tier = getTier(rate);
                    const progress = (rate / 100) * CIRCUMFERENCE;

                    return (
                        <s-section key={m.key}>
                            <s-stack gap="small-400" alignItems="center">
                                <div style={{ position: "relative", width: 110, height: 110 }}>
                                    <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                                        <circle cx="55" cy="55" r={R} fill="none" stroke="#f3f4f6" strokeWidth="10" />
                                        <circle
                                            cx="55"
                                            cy="55"
                                            r={R}
                                            fill="none"
                                            stroke={m.color}
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
                                            style={{ transition: "stroke-dasharray 0.6s ease" }}
                                        />
                                    </svg>
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "2px",
                                        }}
                                    >
                                        <span style={{ fontSize: "20px" }}>{m.icon}</span>
                                        <span style={{ fontSize: "18px", fontWeight: 700, color: m.color, lineHeight: 1 }}>
                                            {rateStr}%
                                        </span>
                                    </div>
                                </div>

                                <s-stack gap="small-200" alignItems="center">
                                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>{m.heading}</div>
                                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                        {m.value.toLocaleString()} {m.label} / {views.toLocaleString()} Views
                                    </div>
                                    <div
                                        style={{
                                            display: "inline-block",
                                            padding: "3px 10px",
                                            borderRadius: "99px",
                                            background: tier.bg,
                                            color: tier.text,
                                            fontSize: "11px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {tier.label}
                                    </div>
                                </s-stack>
                            </s-stack>
                        </s-section>
                    );
                })}
            </s-grid>
        </s-query-container>
    );
}
