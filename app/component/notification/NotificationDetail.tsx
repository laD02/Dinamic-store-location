import { typeColor, typeIcon } from "./utils";
import { DailyReportStats } from "./DailyReportStats";
import { WeeklyReportStats } from "./WeeklyReportStats";
import { MonthlyReportStats } from "./MonthlyReportStats";

const DAILY_REPORT_TITLE = "Daily Analytics Report";
const WEEKLY_REPORT_TITLE = "Weekly Analytics Report";
const MONTHLY_REPORT_TITLE = "Monthly Analytics Report";

interface Props {
    notif: any;
    onBack: () => void;
}

export function NotificationDetail({ notif, onBack }: Props) {
    const isDailyReport = notif.title === DAILY_REPORT_TITLE;
    const isWeeklyReport = notif.title === WEEKLY_REPORT_TITLE;
    const isMonthlyReport = notif.title === MONTHLY_REPORT_TITLE;

    return (
        <div className="notif-detail-panel">
            {/* Header */}
            <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--s-color-border-subdued)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#fcfcfc'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(0,0,0,0.05)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        padding: '5px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#374151',
                        fontSize: '13px',
                        fontWeight: '500',
                        gap: '4px',
                        transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.09)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                >
                    ← Back
                </button>
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>
                    Announcement details
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', maxHeight: '520px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {/* Icon + meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: typeColor(notif.type).bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: typeColor(notif.type).icon
                    }}>
                        <s-icon type={typeIcon(notif.type) as any} />
                    </div>
                    <div>
                        <span style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            background: typeColor(notif.type).bg,
                            color: typeColor(notif.type).icon,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            marginBottom: '4px'
                        }}>
                            {notif.type || 'info'}
                        </span>
                        <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
                            {new Date(notif.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                            {' · '}
                            {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#111827', lineHeight: '1.3' }}>
                    {notif.title}
                </h4>

                {/* Message */}
                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: '1.7' }}>
                    {notif.message}
                </p>

                {/* Daily report stats */}
                {isDailyReport && (
                    <DailyReportStats notifCreatedAt={notif.createdAt} />
                )}

                {/* Weekly report stats */}
                {isWeeklyReport && (
                    <WeeklyReportStats notifCreatedAt={notif.createdAt} />
                )}

                {/* Monthly report stats */}
                {isMonthlyReport && (
                    <MonthlyReportStats notifCreatedAt={notif.createdAt} />
                )}

                {/* Placeholder for other notification types */}
                {!isDailyReport && !isWeeklyReport && !isMonthlyReport && (
                    <div style={{
                        background: '#f9fafb',
                        borderRadius: '10px',
                        padding: '16px',
                        border: '1px dashed #e5e7eb',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '12px'
                    }}>
                        No additional details available.
                    </div>
                )}
            </div>
        </div>
    );
}
