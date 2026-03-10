

import { typeColor, typeIcon } from "./utils";

interface Props {
    notif: any;
    isRead: boolean;
    onClick: () => void;
}

export function NotificationItem({ notif, isRead, onClick }: Props) {
    return (
        <div
            className="notification-item notif-item-clickable"
            onClick={onClick}
            style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                cursor: 'pointer',
                background: isRead ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                transition: 'all 0.2s',
                position: 'relative',
                display: 'flex',
                gap: '14px'
            }}
        >
            {/* Icon */}
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: typeColor(notif.type).bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: typeColor(notif.type).icon
            }}>
                <s-icon type={typeIcon(notif.type) as any} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontWeight: isRead ? '600' : '700',
                    fontSize: '14px',
                    marginBottom: '4px',
                    color: isRead ? '#4b5563' : '#111827',
                    lineHeight: '1.2'
                }}>
                    {notif.title}
                </div>
                <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {notif.message}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '500'
                }}>
                    <span style={{
                        width: '4px',
                        height: '4px',
                        background: '#d1d5db',
                        borderRadius: '50%',
                        display: isRead ? 'none' : 'block'
                    }} />
                    {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' • '}
                    {new Date(notif.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Unread dot */}
            {!isRead && (
                <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#3b82f6',
                    borderRadius: '50%',
                    marginTop: '6px',
                    flexShrink: 0
                }} />
            )}
        </div>
    );
}
