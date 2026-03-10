import { useEffect } from "react";
import { useFetcher } from "react-router";

interface Props {
    notifCreatedAt: string;
}

function InsightCard({
    icon, bg, border, labelColor, label, children, wide
}: {
    icon: string;
    bg: string;
    border: string;
    labelColor: string;
    label: string;
    children: React.ReactNode;
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
                <span style={{ fontSize: '11px', fontWeight: '700', color: labelColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                </span>
            </div>
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}

export function MonthlyReportStats({ notifCreatedAt }: Props) {
    const fetcher = useFetcher<{ stats: any }>();

    useEffect(() => {
        const reportDate = new Date(notifCreatedAt);
        const dateStr = reportDate.toISOString().split("T")[0];
        fetcher.load(`/app/api/notifications?intent=monthlyReport&date=${dateStr}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifCreatedAt]);

    if (fetcher.state === "loading" || !fetcher.data) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: '13px' }}>
                Loading monthly stats...
            </div>
        );
    }

    const { totalViews, topActivityStore, top3Stores, range } = fetcher.data.stats ?? {};

    if (!totalViews && !topActivityStore) {
        return (
            <div style={{
                background: '#f9fafb', borderRadius: '10px', padding: '16px',
                border: '1px dashed #e5e7eb', textAlign: 'center', color: '#9ca3af', fontSize: '12px'
            }}>
                No monthly data available.
            </div>
        );
    }

    const formatMonthRange = (start: string, end: string) => {
        const s = new Date(start);
        const e = new Date(end);
        return `${s.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    };
    const rangeLabel = range ? formatMonthRange(range.start, range.end) : 'Last Month';

    const viewsDir = totalViews?.growth >= 0 ? '↑' : '↓';
    const viewsColor = totalViews?.growth >= 0 ? '#16a34a' : '#dc2626';

    const rankEmojis = ['🥇', '🥈', '🥉'];

    return (
        <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b' }}>
            {/* Header */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Monthly Highlights</div>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px'
                }}>
                    {rangeLabel}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {/* 1. Total Views Banner (Blue/Indigo) */}
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
                                Total Views This Month
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: '900', color: '#312e81', lineHeight: 1 }}>
                                {totalViews?.current?.toLocaleString() ?? '—'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                vs {totalViews?.prev?.toLocaleString() ?? 0} prev month
                            </div>
                        </div>
                    </div>
                    {totalViews?.growth != null && (
                        <div style={{ fontSize: '20px', fontWeight: '900', color: viewsColor, flexShrink: 0 }}>
                            {viewsDir}{Math.abs(totalViews.growth)}%
                        </div>
                    )}
                </div>

                {/* 2. Top Activity Store (Amber) */}
                <InsightCard
                    wide
                    icon="🏃"
                    bg="linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)"
                    border="#fde68a"
                    labelColor="#b45309"
                    label="Most Active Store"
                >
                    {topActivityStore ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px', marginBottom: '2px' }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {topActivityStore.storeName}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#92400e', flexShrink: 0 }}>
                                    {topActivityStore.total.toLocaleString()} acts
                                </div>
                            </div>
                            {topActivityStore.city && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{topActivityStore.city}</div>}
                        </>
                    ) : (
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No data</div>
                    )}
                </InsightCard>

                {/* 3. Top 3 Stores by Score (Emerald) */}
                <InsightCard
                    wide
                    icon="🏆"
                    bg="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)"
                    border="#a7f3d0"
                    labelColor="#047857"
                    label="Top 3 Stores (Engagement Score)"
                >
                    {top3Stores && top3Stores.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                            {top3Stores.map((store: any, i: number) => (
                                <div key={store.storeName} style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: '8px',
                                    padding: '6px 8px',
                                    background: i === 0 ? '#fef9c3' : '#fafafa',
                                    borderRadius: '8px',
                                    border: i === 0 ? '1px solid #fde68a' : '1px solid #f1f5f9'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                        <span style={{ fontSize: '15px', flexShrink: 0 }}>{rankEmojis[i]}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {store.storeName}
                                            </div>
                                            {store.city && <div style={{ fontSize: '10px', color: '#94a3b8' }}>{store.city}</div>}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#047857', flexShrink: 0 }}>
                                        {store.score.toLocaleString()} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No data</div>
                    )}
                </InsightCard>
            </div>
        </div>
    );
}
