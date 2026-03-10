import { useEffect } from "react";
import { useFetcher } from "react-router";

interface Props {
    notifCreatedAt: string;
}

function InsightCard({
    icon, bg, border, labelColor, label, name, sub, value, valueColor, wide
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
    wide?: boolean;
}) {
    return (
        <div style={{
            gridColumn: wide ? '1 / -1' : undefined,
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
                        {sub && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sub}</div>}
                    </>
                ) : (
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No data</div>
                )}
            </div>
        </div>
    );
}

export function WeeklyReportStats({ notifCreatedAt }: Props) {
    const fetcher = useFetcher<{ stats: any }>();

    useEffect(() => {
        const reportDate = new Date(notifCreatedAt);
        const dateStr = reportDate.toISOString().split("T")[0];
        fetcher.load(`/app/api/notifications?intent=weeklyReport&date=${dateStr}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifCreatedAt]);

    if (fetcher.state === "loading" || !fetcher.data) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '13px' }}>
                Loading weekly stats...
            </div>
        );
    }

    const { totalViews, topViewsStore, topSearchStore, peakDay, range } = fetcher.data.stats ?? {};

    if (!totalViews && !topViewsStore && !peakDay) {
        return (
            <div style={{
                background: '#f9fafb', borderRadius: '10px', padding: '16px',
                border: '1px dashed #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: '12px'
            }}>
                No weekly data available.
            </div>
        );
    }

    const formatDateRange = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };
    const rangeLabel = range ? formatDateRange(range.start, range.end) : 'Last 7 Days';

    // Total views card values
    const viewsGrowthDir = totalViews?.growth >= 0 ? '↑' : '↓';
    const viewsGrowthColor = totalViews?.growth >= 0 ? '#16a34a' : '#dc2626';

    return (
        <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' }}>
            {/* Header */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Weekly Highlights</div>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px'
                }}>
                    {rangeLabel}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {/* 1. Total Views with growth (Blue) */}
                <div style={{
                    gridColumn: '1 / -1',
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
                    borderRadius: '12px',
                    border: '1px solid #c7d2fe',
                    padding: '14px 16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                        }}>
                            👁
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                                Total Views This Week
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '900', color: '#312e81', lineHeight: 1 }}>
                                {totalViews?.current?.toLocaleString() ?? '—'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                vs {totalViews?.prev?.toLocaleString() ?? 0} last week
                            </div>
                        </div>
                    </div>
                    {totalViews?.growth != null && (
                        <div style={{
                            fontSize: '20px', fontWeight: '900',
                            color: viewsGrowthColor,
                            flexShrink: 0
                        }}>
                            {viewsGrowthDir}{Math.abs(totalViews.growth)}%
                        </div>
                    )}
                </div>

                {/* 2. Top Views Store (Emerald) */}
                <InsightCard
                    icon="🏆"
                    bg="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                    border="#a7f3d0"
                    labelColor="#047857"
                    label="Top Views Store"
                    name={topViewsStore?.storeName}
                    sub={topViewsStore?.city}
                    value={topViewsStore ? `${topViewsStore.views.toLocaleString()} views` : undefined}
                    valueColor="#047857"
                />

                {/* 3. Top Search Store (Purple) */}
                <InsightCard
                    icon="🔍"
                    bg="linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)"
                    border="#e9d5ff"
                    labelColor="#7e22ce"
                    label="Most Searched"
                    name={topSearchStore?.storeName}
                    sub={topSearchStore?.city}
                    value={topSearchStore ? `${topSearchStore.searches.toLocaleString()} searches` : undefined}
                    valueColor="#7e22ce"
                />

                {/* 4. Peak Day (Amber) */}
                <InsightCard
                    wide
                    icon="🔥"
                    bg="linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)"
                    border="#fde68a"
                    labelColor="#b45309"
                    label="Peak Day"
                    name={peakDay ? new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : undefined}
                    value={peakDay ? `${peakDay.value.toLocaleString('en-US')} activities` : undefined}
                    valueColor="#b45309"
                />
            </div>
        </div>
    );
}
