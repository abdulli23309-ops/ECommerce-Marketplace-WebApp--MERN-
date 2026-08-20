import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    purpose: {
      type: String,
      enum: ['account_verification', 'password_reset'],
      default: 'account_verification',
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

emailOtpSchema.index({ user: 1, purpose: 1 });

// Auto-remove expired OTP documents.
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema);

export default EmailOtp;