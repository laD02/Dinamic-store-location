import { useEffect } from "react";
import { useFetcher } from "react-router";

interface Props {
    notifCreatedAt: string;
}

function InsightCard({
    icon,
    bg,
    border,
    labelColor,
    label,
    name,
    sub,
    value,
    valueColor,
}: {
    icon: string;
    bg: string;
    border: string;
    labelColor: string;
    label: string;
    name?: string;
    sub?: string;
    value?: string;
    valueColor?: string;
}) {
    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${border}`,
            padding: '12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '13px'
                }}>
                    {icon}
                </div>
                <span style={{
                    fontSize: '11px', fontWeight: '700', color: labelColor,
                    textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                    {label}
                </span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {name ? (
                    <>
                        <div style={{
                            display: 'flex', alignItems: 'flex-end',
                            justifyContent: 'space-between', gap: '8px', marginBottom: '2px'
                        }}>
                            <div style={{
                                fontSize: '13px', fontWeight: '600', color: '#111827',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                            }}>
                                {name}
                            </div>
                            {value && (
                                <div style={{
                                    fontSize: '13px', fontWeight: '800',
                                    color: valueColor ?? '#111827', flexShrink: 0
                                }}>
                                    {value}
                                </div>
                            )}
                        </div>
                        {sub && (
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sub}</div>
                        )}
                    </>
                ) : (
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                        No data
                    </div>
                )}
            </div>
        </div>
    );
}

export function DailyReportStats({ notifCreatedAt }: Props) {
    const fetcher = useFetcher<{ stats: any }>();

    useEffect(() => {
        const reportDate = new Date(notifCreatedAt);
        reportDate.setDate(reportDate.getDate() - 1);
        const dateStr = reportDate.toISOString().split("T")[0];
        fetcher.load(`/app/api/notifications?intent=dailyReport&date=${dateStr}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifCreatedAt]);

    if (fetcher.state === "loading" || !fetcher.data) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '13px' }}>
                Loading daily stats...
            </div>
        );
    }

    const { topViewsGrowth, topActivity, highViewLowClick, lowestViews, date } = fetcher.data.stats ?? {};

    if (!topViewsGrowth && !topActivity && !highViewLowClick && !lowestViews) {
        return (
            <div style={{
                background: '#f9fafb', borderRadius: '10px', padding: '16px',
                border: '1px dashed #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: '12px'
            }}>
                No data available for this date.
            </div>
        );
    }

    const reportDate = date ? new Date(date) : null;
    const dateLabel = reportDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const growthDir = topViewsGrowth?.growth != null ? (topViewsGrowth.growth >= 0 ? '↑' : '↓') : '';
    const growthColor = topViewsGrowth?.growth != null ? (topViewsGrowth.growth >= 0 ? '#16a34a' : '#dc2626') : '#111827';

    return (
        <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' }}>
            {/* Header */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Daily Highlights</div>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px'
                }}>
                    {dateLabel ?? 'Yesterday'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {/* 1. Top Views Growth (Blue/Indigo) */}
                <InsightCard
                    icon="📈"
                    bg="linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)"
                    border="#c7d2fe"
                    labelColor="#4338ca"
                    label="Top View Growth"
                    name={topViewsGrowth?.storeName}
                    sub={topViewsGrowth?.city}
                    value={topViewsGrowth ? `${growthDir}${Math.abs(topViewsGrowth.growth)}%` : undefined}
                    valueColor={growthColor}
                />

                {/* 2. Top Activity (Amber) */}
                <InsightCard
                    icon="🏃"
                    bg="linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)"
                    border="#fde68a"
                    labelColor="#b45309"
                    label="Most Active"
                    name={topActivity?.storeName}
                    sub={topActivity?.city}
                    value={topActivity ? `${topActivity.total.toLocaleString()} acts` : undefined}
                    valueColor="#92400e"
                />

                {/* 3. High View Low Click (Rose) */}
                <InsightCard
                    icon="⚡"
                    bg="linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)"
                    border="#fecdd3"
                    labelColor="#be123c"
                    label="Low Conversion"
                    name={highViewLowClick?.storeName}
                    sub={highViewLowClick ? `${highViewLowClick.views} views / ${highViewLowClick.clicks} clicks` : undefined}
                    value={highViewLowClick ? `${highViewLowClick.ratio}% CTR` : undefined}
                    valueColor="#be123c"
                />

                {/* 4. Lowest Views (Rose) */}
                <InsightCard
                    icon="⚠️"
                    bg="linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)"
                    border="#fecdd3"
                    labelColor="#be123c"
                    label="Lowest Views"
                    name={lowestViews?.storeName}
                    sub={lowestViews?.city}
                    value={lowestViews ? `${lowestViews.current}` : undefined}
                    valueColor="#be123c"
                />
            </div>
        </div>
    );
}
