import nodemailer from "nodemailer";

const buildTransporter = () => {
  if (process.env.EMAIL_PROVIDER !== "smtp") {
    return null;
  }

  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];

  if (required.some((key) => !process.env[key])) {
    if (process.env.NODE_ENV === "production") {
      console.error("[EMAIL] SMTP is not fully configured. OTP email delivery is disabled.");
    }

    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendOtpEmail = async (email, otp, purpose) => {
  const transporter = buildTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[EMAIL] Cannot send OTP to ${email}; SMTP not configured.`);
      return { delivered: false, devMode: false };
    }

    console.log(`[DEV EMAIL] To: ${email}`);
    console.log(`[DEV EMAIL] Purpose: ${purpose}`);
    console.log(`[DEV EMAIL] OTP: ${otp}`);

    return { delivered: false, devMode: true };
  }

  const subject =
    purpose === "password_reset"
      ? "VendorVerse Password Reset OTP"
      : "VendorVerse Email Verification OTP";

  const text = `Your VendorVerse OTP is ${otp}. It expires in 3 minutes. Do not share this code.`;

  const html = `
    <p>Your VendorVerse OTP is <strong>${otp}</strong>.</p>
    <p>It expires in 3 minutes. Do not share this code.</p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text,
    html,
  });

  return { delivered: true, devMode: false };
};