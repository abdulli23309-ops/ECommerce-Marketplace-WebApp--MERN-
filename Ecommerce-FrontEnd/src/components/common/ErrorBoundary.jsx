import React from "react";

/**
 * Global error boundary (UI-02). The app currently had no boundary — any render
 * crash produced a blank screen. This catches render errors and shows a friendly
 * recovery screen instead of leaving the user with a white page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "" };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>😕</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "46ch" }}>
            An unexpected error occurred. You can try again, or reload the page.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              className="vv-btn vv-btn--primary"
              onClick={this.handleReset}
            >
              Try Again
            </button>
            <button
              type="button"
              className="vv-btn vv-btn--secondary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;