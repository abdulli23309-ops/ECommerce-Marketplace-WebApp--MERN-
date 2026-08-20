import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from "../../services/notificationService";

const NotificationDropdown = ({
  placement = "up",
  linkEnabled = true,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: undefined, right: undefined });

  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const loadUnread = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnread(res.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load unread count", err);
    }
  }, []);

  useEffect(() => {
    loadUnread();
  }, [loadUnread]);

  const updateCoords = useCallback(() => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const gap = 8;
    const viewportWidth = window.innerWidth;

    if (placement === "down") {
      // Customer navbar: opens downward, aligns right edge
      setCoords({
        top: rect.bottom + gap,
        left: undefined,
        right: viewportWidth - rect.right,
      });
    } else {
      // Sidebar: opens upward, aligns left edge
      setCoords({
        top: rect.top - gap,
        left: rect.left,
        right: undefined,
      });
    }
  }, [placement]);

  useEffect(() => {
    if (!open) return;

    updateCoords();
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const toggleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      updateCoords();
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

  const markReadAndClose = async (notification) => {
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

  const menuStyle = {
    position: "fixed",
    top: coords.top,
    left: coords.left,
    right: coords.right,
    transform: placement === "up" ? "translateY(-100%)" : undefined,
    width: "min(320px, calc(100vw - 20px))",
    maxHeight: "400px",
    overflowY: "auto",
    background: "var(--glass-bg)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid var(--glass-border)",
    borderRadius: "14px",
    boxShadow: "var(--glass-shadow)",
    zIndex: 99999,
  };

  return (
    <>
      <div ref={buttonRef} style={{ display: "inline-block" }}>
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
      </div>

      {open &&
        createPortal(
          <div ref={menuRef} style={menuStyle}>
            {loading ? (
              <div style={{ padding: "16px", color: "var(--text-secondary)" }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "16px", color: "var(--text-muted)" }}>
                No notifications
              </div>
            ) : (
              notifications.map((n) => {
                const itemStyle = {
                  display: "block",
                  padding: "12px 16px",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border)",
                  color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)",
                  background: n.isRead ? "transparent" : "var(--surface-hover)",
                  cursor: "pointer",
                };

                if (linkEnabled && n.link) {
                  return (
                    <Link
                      key={n._id}
                      to={n.link}
                      onClick={() => markReadAndClose(n)}
                      style={itemStyle}
                    >
                      <strong style={{ fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                        {n.title}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        {n.message}
                      </span>
                    </Link>
                  );
                }

                return (
                  <div
                    key={n._id}
                    onClick={() => markReadAndClose(n)}
                    style={itemStyle}
                  >
                    <strong style={{ fontSize: "0.9rem", display: "block", marginBottom: "4px" }}>
                      {n.title}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {n.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
};

export default NotificationDropdown;