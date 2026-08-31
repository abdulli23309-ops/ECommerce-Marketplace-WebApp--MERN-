import React from "react";
import Button from "./Button";

/**
 * Consistent error-state block (UI-02) with optional retry + back actions.
 * `statusCode` may be used to switch messaging (401/403/404/500/network).
 */
const defaultCopy = (statusCode) => {
  switch (statusCode) {
    case 401:
      return { title: "Your session has expired", body: "Please sign in again to continue." };
    case 403:
      return { title: "Access Denied", body: "You don't have permission to view this page." };
    case 404:
      return { title: "Page Not Found", body: "We couldn't find what you were looking for." };
    case 408:
      return { title: "Request timed out", body: "The server took too long to respond. Please try again." };
    default:
      return { title: "Something went wrong", body: "We couldn't load this right now. Please try again." };
  }
};

const ErrorIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 1.25rem" }} className="sparkline-svg">
    <circle cx="60" cy="60" r="48" fill="var(--danger-bg)" stroke="color-mix(in srgb, var(--danger) 30%, transparent)" strokeWidth="1.5" strokeDasharray="4 4" />
    <path d="M60 34l22 38H38l22-38z" fill="var(--surface)" stroke="var(--danger)" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M60 48v10" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="60" cy="64" r="1.5" fill="var(--danger)" />
    <circle cx="34" cy="52" r="3" fill="var(--danger)" opacity="0.6" />
    <circle cx="86" cy="52" r="3" fill="var(--danger)" opacity="0.6" />
  </svg>
);

const ErrorState = ({
  statusCode,
  title,
  body,
  onRetry,
  retryLabel = "Try Again",
  onBack,
  backLabel = "Go Back",
  style,
}) => {
  const copy = defaultCopy(statusCode);
  const finalTitle = title || copy.title;
  const finalBody = body || copy.body;

  return (
    <div className="vv-error page-fade-slide" role="alert" style={{ border: "1px dashed var(--border)", background: "var(--surface)", padding: "3rem 2rem", ...style }}>
      <ErrorIllustration />
      <div className="vv-error__title" style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{finalTitle}</div>
      {finalBody && <p className="vv-error__body" style={{ color: "var(--text-secondary)", marginBottom: "1.25rem" }}>{finalBody}</p>}
      {(onRetry || onBack) && (
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {onRetry && (
            <Button variant="primary" size="lg" onClick={onRetry} style={{ borderRadius: "8px" }}>
              {retryLabel}
            </Button>
          )}
          {onBack && (
            <Button variant="secondary" size="lg" onClick={onBack} style={{ borderRadius: "8px" }}>
              {backLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;