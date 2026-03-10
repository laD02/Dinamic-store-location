interface Props {
    isOpen: boolean;
    unreadCount: number;
    onClick: () => void;
}

export function NotificationBadgeButton({ isOpen, unreadCount, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            style={{
                background: isOpen ? 'rgba(0,0,0,0.06)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                color: 'var(--s-color-text)',
                outline: 'none'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = isOpen ? 'rgba(0,0,0,0.06)' : 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <s-icon type="notification" />
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#d82c0d',
                    color: 'white',
                    borderRadius: '8px',
                    minWidth: '14px',
                    height: '14px',
                    padding: '0 2px',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    border: '1.5px solid white',
                    boxSizing: 'content-box',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    animation: 'pulse-red 2s infinite',
                    lineHeight: 1
                }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </button>
    );
}
