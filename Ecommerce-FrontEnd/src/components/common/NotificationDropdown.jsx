import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from "../../services/notificationService";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const loadUnread = async () => {
    try {
      const res = await fetchUnreadCount();
      setUnread(res.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load unread count", err);
    }
  };

  useEffect(() => {
    loadUnread();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      setLoading(true);
      try {
        const res = await fetchNotifications({ page: 1, pageSize: 10 });
        setNotifications(res.items || []);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
        setUnread((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch (err) {
        console.error("Failed to mark notification read", err);
      }
    }
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={toggleOpen}
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          padding: "4px 10px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--text-primary)",
          transition: "all .2s",
        }}
        title="Notifications"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              backgroundColor: "var(--danger)",
              color: "#fff",
              borderRadius: "50%",
              fontSize: "0.7rem",
              padding: "0 5px",
              lineHeight: "1.4",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "320px",
            maxHeight: "400px",
            overflowY: "auto",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px var(--shadow)",
            zIndex: 1000,
          }}
        >
          {loading ? (
            <div style={{ padding: "16px", color: "var(--text-secondary)" }}>Loading...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "16px", color: "var(--text-muted)" }}>No notifications</div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n._id}
                to={n.link || "#"}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: "block",
                  padding: "12px 16px",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border)",
                  color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)",
                  background: n.isRead ? "transparent" : "var(--surface-hover)",
                }}
              >
                <strong style={{ fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                  {n.title}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  {n.message}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;