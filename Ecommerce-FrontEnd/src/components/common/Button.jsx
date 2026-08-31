import React from "react";

/**
 * Shared Button with loading state (UI-01).
 *
 * Renders an <a> when `to` is provided, otherwise a <button>.
 * When `loading` is true the button is disabled and shows an inline spinner,
 * preventing double-submit on critical operations (ordering, approving, etc.).
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  block = false,
  to = null,
  type = "button",
  className = "",
  onClick,
  style,
  ...rest
}) => {
  const cls = [
    "vv-btn",
    `vv-btn--${variant}`,
    size !== "md" ? `vv-btn--${size}` : "",
    block ? "vv-btn--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = loading ? (
    <>
      <span className="vv-btn__spinner" aria-hidden="true" />
      <span>{children}</span>
    </>
  ) : (
    children
  );

  const mergedDisabled = disabled || loading;

  if (to) {
    return (
      <a
        href={to}
        className={cls}
        style={style}
        onClick={onClick}
        aria-disabled={mergedDisabled}
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={mergedDisabled}
      style={style}
      onClick={onClick}
      {...rest}
    >
      {inner}
    </button>
  );
};

/**
 * Convenience: a Button that shows "Saving…" instead of content while pending.
 * Use for submit actions so the label communicates the in-flight state.
 */
export const LoadingButton = ({
  loading,
  loadingText = "Loading…",
  children,
  ...rest
}) => (
  <Button loading={loading} {...rest}>
    {loading ? loadingText : children}
  </Button>
);

export default Button;