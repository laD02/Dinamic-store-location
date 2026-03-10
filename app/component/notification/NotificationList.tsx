import { NotificationItem } from "./NotificationItem";

interface Props {
    notifications: any[];
    unreadCount: number;
    seenIds: Set<string>;
    onSelect: (notif: any) => void;
    onMarkAllRead: () => void;
}

export function NotificationList({ notifications, unreadCount, seenIds, onSelect, onMarkAllRead }: Props) {
    return (
        <div className="notif-list-panel">
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--s-color-border-subdued)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fcfcfc'
            }}>
                <h3 style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: '#111827' }}>Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllRead}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--s-color-text-interactive)',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,128,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '440px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: '#f3f4f6',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: '#9ca3af'
                        }}>
                            <s-icon type="notification" />
                        </div>
                        <h4 style={{ margin: '0 0 4px', color: '#374151', fontSize: '15px', fontWeight: '600' }}>All caught up!</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>No new notifications at the moment.</p>
                    </div>
                ) : (
                    notifications.map((notif: any) => {
                        const isRead = notif.isRead || seenIds.has(notif.id);
                        return (
                            <NotificationItem
                                key={notif.id}
                                notif={notif}
                                isRead={isRead}
                                onClick={() => onSelect(notif)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
