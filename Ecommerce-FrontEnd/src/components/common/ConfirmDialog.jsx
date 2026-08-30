import React from "react";
import Modal from "./Modal";
import Button from "./Button";

/**
 * Confirmation dialog for risky / destructive actions (UI-02). Use instead of
 * ad-hoc window.confirm or silent destructive clicks. Intentionally NOT used
 * for routine reversible actions (see optimistic-UI plan).
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    footer={
      <>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    {message && <p style={{ margin: 0, color: "var(--text-secondary)" }}>{message}</p>}
  </Modal>
);

export default ConfirmDialog;