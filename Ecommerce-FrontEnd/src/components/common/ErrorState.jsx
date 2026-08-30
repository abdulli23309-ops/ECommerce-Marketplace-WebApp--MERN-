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
      return { title: "You don't have access", body: "You don't have permission to view this page." };
    case 404:
      return { title: "Not found", body: "We couldn't find what you were looking for." };
    case 408:
      return { title: "Request timed out", body: "The server took too long to respond. Please try again." };
    default:
      return { title: "Something went wrong", body: "We couldn't load this right now. Please try again." };
  }
};

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
    <div className="vv-error" role="alert" style={style}>
      <div className="vv-error__icon" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="vv-error__title">{finalTitle}</div>
      {finalBody && <p className="vv-error__body">{finalBody}</p>}
      {(onRetry || onBack) && (
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              {backLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;