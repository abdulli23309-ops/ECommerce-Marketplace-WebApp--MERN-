import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Accessible modal (UI-02). Handles focus trapping, Escape-to-close, overlay
 * click-to-close and restores focus to the trigger. Replace page-local ad-hoc
 * modals with this for consistent behaviour.
 */
const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  labelledBy,
  closeOnOverlay = true,
  panelClassName = "",
}) => {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement;

    // Trap focus within the panel
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    // Move initial focus inside the panel (or its first control)
    const timer = setTimeout(() => {
      panelRef.current?.querySelector("button, [href], input, select, textarea")?.focus() ||
        panelRef.current?.focus();
    }, 30);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      className="vv-modal__overlay"
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={`vv-modal__panel ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {title && (
          <div className="vv-modal__header">
            <div className="vv-modal__title" id={labelledBy}>
              {title}
            </div>
            <button
              type="button"
              className="vv-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        )}
        <div className="vv-modal__body">{children}</div>
        {footer && <div className="vv-modal__footer">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Modal;