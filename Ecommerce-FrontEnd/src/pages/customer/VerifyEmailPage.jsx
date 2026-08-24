import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { sendOtp, verifyOtp } from "../../services/emailOtpService";
import { setEmailVerified } from "../../store/authSlice";

const formatCountdown = (seconds) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.auth.user);

  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setTimeout(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingSeconds]);

  const handleSendOtp = async () => {
    if (!user?.email) {
      setMessage({ type: "error", text: "No email address found for this account." });
      return;
    }

    setSending(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await sendOtp("account_verification");

      const expiresAt = response?.expiresAt;
      const seconds = expiresAt
        ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
        : 180;

      setRemainingSeconds(seconds);
      setOtpSent(true);

      setMessage({
        type: "success",
        text: "OTP sent. Check your email or server console in dev mode.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to send OTP.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setMessage({ type: "error", text: "Please enter the OTP." });
      return;
    }

    setVerifying(true);
    setMessage({ type: "", text: "" });

    try {
      await verifyOtp(otp.trim(), "account_verification");

      dispatch(setEmailVerified());

      setMessage({ type: "success", text: "Email verified successfully." });

      setTimeout(() => {
        navigate(location.state?.from || "/");
      }, 900);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Invalid OTP.",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", color: "var(--text-primary)" }}>
          Verify Email
        </h2>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={user?.email || ""}
            readOnly
            disabled
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleSendOtp}
          disabled={sending || remainingSeconds > 0}
        >
          {sending
            ? "Sending..."
            : remainingSeconds > 0
              ? `Resend OTP in ${formatCountdown(remainingSeconds)}`
              : "Send OTP"}
        </button>

        <div className="form-group" style={{ marginTop: "1.25rem" }}>
          <label className="form-label">OTP Code</label>
          <input
            type="text"
            className="form-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="6-digit code"
            maxLength="6"
          />
        </div>

        <button
          className="btn-primary"
          onClick={handleVerifyOtp}
          disabled={verifying || !otpSent || remainingSeconds <= 0}
        >
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        {otpSent && remainingSeconds === 0 && (
          <p
            style={{
              marginTop: "1rem",
              color: "var(--warning-text)",
              backgroundColor: "var(--warning-bg)",
              padding: "0.75rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            This OTP has expired. Please request a new one.
          </p>
        )}

        {message.text && (
          <p
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor:
                message.type === "success"
                  ? "var(--success-bg)"
                  : "var(--danger-bg)",
              color:
                message.type === "success"
                  ? "var(--success-text)"
                  : "var(--danger-text)",
            }}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;