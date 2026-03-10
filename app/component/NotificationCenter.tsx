import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { NotificationBadgeButton } from "./notification/NotificationBadgeButton";
import { io } from "socket.io-client";
import { NotificationList } from "./notification/NotificationList";
import { NotificationDetail } from "./notification/NotificationDetail";

export default function NotificationCenter() {
    const fetcher = useFetcher();
    const writeFetcher = useFetcher();
    const [isOpen, setIsOpen] = useState(false);
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetcher.load("/app/api/notifications");

        // Connect to WebSocket with dedicated path
        const socket = io({
            path: "/socket.io",
            transports: ["websocket", "polling"]
        });

        socket.on("connect", () => {
        });

        socket.on("notification:new", (data: any) => {
            // Refresh notifications immediately
            fetcher.load("/app/api/notifications");
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSelectedNotification(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const notifications = fetcher.data?.notifications || [];
    const unreadCount = fetcher.data?.unreadCount || 0;

    const handleMarkAsRead = (id: string) => {
        setSeenIds(prev => new Set([...prev, id]));
        const formData = new FormData();
        formData.append("intent", "markAsRead");
        formData.append("id", id);
        writeFetcher.submit(formData, { method: "post", action: "/app/api/notifications" });
    };

    const handleMarkAllAsRead = () => {
        const formData = new FormData();
        formData.append("intent", "markAllAsRead");
        writeFetcher.submit(formData, { method: "post", action: "/app/api/notifications" });
    };

    const handleSelectNotif = (notif: any) => {
        setSelectedNotification(notif);
        const isRead = notif.isRead || seenIds.has(notif.id);
        if (!isRead) handleMarkAsRead(notif.id);
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-red {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
                }
                @keyframes dropdown-fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(18px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slide-in-left {
                    from { opacity: 0; transform: translateX(-18px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .notification-dropdown { animation: dropdown-fade-in 0.2s ease-out forwards; }
                .notif-detail-panel { animation: slide-in-right 0.22s ease-out forwards; }
                .notif-list-panel { animation: slide-in-left 0.22s ease-out forwards; }
                .notification-item:hover { background-color: var(--s-color-background-surface-secondary) !important; }
                .notif-item-clickable { cursor: pointer; transition: background 0.15s; }
                .notif-item-clickable:hover { background-color: rgba(0,0,0,0.03) !important; }
            `}} />

            <NotificationBadgeButton
                isOpen={isOpen}
                unreadCount={unreadCount}
                onClick={() => { setIsOpen(prev => !prev); setSelectedNotification(null); }}
            />

            {isOpen && (
                <div className="notification-dropdown" style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    right: '-4px',
                    width: '360px',
                    background: 'white',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04), 0 0 1px 0 rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.08)'
                }}>
                    {selectedNotification ? (
                        <NotificationDetail
                            notif={selectedNotification}
                            onBack={() => setSelectedNotification(null)}
                        />
                    ) : (
                        <NotificationList
                            notifications={notifications}
                            unreadCount={unreadCount}
                            seenIds={seenIds}
                            onSelect={handleSelectNotif}
                            onMarkAllRead={handleMarkAllAsRead}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
