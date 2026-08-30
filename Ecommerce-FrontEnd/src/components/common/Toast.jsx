import React from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * Global toast feedback (UI-02). Wire a single <ToastHost /> at the app root
 * (once, via main.jsx / App). Rules:
 *   - toasts are for cross-context / global feedback, NOT per-field validation
 *   - keep them short; title + brief message
 *   - prefer inline feedback for form fields and card-level errors
 */
export const ToastHost = () => (
  <ToastContainer
    position="top-right"
    autoClose={3000}
    hideProgressBar={false}
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable={false}
    pauseOnHover
    limit={3}
    role="alert"
  />
);

const base = (msg, opts = {}) => ({
  toastId: opts.toastId,
  ...opts,
});

export const toastSuccess = (msg, opts = {}) =>
  toast.success(typeof msg === "string" ? msg : msg?.message ?? "Done", base(opts));
export const toastError = (msg, opts = {}) =>
  toast.error(typeof msg === "string" ? msg : msg?.message ?? "Something went wrong", { ...base(opts), autoClose: 5000 });
export const toastWarning = (msg, opts = {}) =>
  toast.warning(typeof msg === "string" ? msg : msg?.message ?? "Heads up", base(opts));
export const toastInfo = (msg, opts = {}) =>
  toast.info(typeof msg === "string" ? msg : msg?.message ?? "Notice", base(opts));

// Consolidate so consumers can use default `toast` directly if preferred.
export { toast };

export default ToastHost;