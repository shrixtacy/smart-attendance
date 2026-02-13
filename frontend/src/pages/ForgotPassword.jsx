import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CircleCheck,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const OTP_REGEX = /^\d{6}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid = useMemo(() => EMAIL_REGEX.test(normalizedEmail), [normalizedEmail]);
  const isOtpValid = useMemo(() => OTP_REGEX.test(otp.trim()), [otp]);
  const isPasswordValid = useMemo(() => PASSWORD_REGEX.test(newPassword), [newPassword]);
  const isPasswordMatch = useMemo(
    () => confirmPassword.length > 0 && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  const activeStep = !isEmailValid ? 1 : !isOtpValid ? 2 : 3;
  const isSubmitDisabled =
    loading || !isEmailValid || !isOtpValid || !isPasswordValid || !isPasswordMatch;

  useEffect(() => {
    if (resendCooldown === 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const clearMessages = () => {
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleResend = async () => {
    clearMessages();
    if (!isEmailValid) {
      setError("Enter a valid email before requesting a new OTP.");
      return;
    }

    setResendLoading(true);
    // TODO: Replace this simulated delay with real backend API integration
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setResendLoading(false);
    setResendCooldown(30);
    setSuccess("A new 6-digit code has been sent to your email.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isOtpValid) {
      setError("OTP must be exactly 6 digits.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters and include a number.");
      return;
    }
    if (!isPasswordMatch) {
      setError("Confirm password does not match.");
      return;
    }

    setLoading(true);
    // TODO: Replace this simulated delay with real backend API integration
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    setLoading(false);
    setSuccess("Password reset successful. You can now log in with your new password.");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const stepClass = (step) =>
    step === activeStep
      ? "bg-[var(--primary)] text-[var(--text-on-primary)] border-[var(--primary)]"
      : "bg-transparent text-[var(--text-body)] border-[var(--border-color)]";

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--primary)]">
            <Sparkles size={18} />
          </span>
          <p className="text-[22px] font-semibold text-[var(--text-main)]">Smart Attendance</p>
        </div>

        <div className="mt-5 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-main)]">Reset your password</h1>
          <p className="text-base text-[var(--text-body)]">
            Use your registered email to receive a one-time code, then set a new password.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${stepClass(1)}`}>1</span>
            <span className={activeStep === 1 ? "text-[var(--text-main)]" : "text-[var(--text-body)]"}>Email</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${stepClass(2)}`}>2</span>
            <span className={activeStep === 2 ? "text-[var(--text-main)]" : "text-[var(--text-body)]"}>OTP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${stepClass(3)}`}>3</span>
            <span className={activeStep === 3 ? "text-[var(--text-main)]" : "text-[var(--text-body)]"}>New password</span>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-[var(--text-main)]">
              Email address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-body)]"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                placeholder="Enter your registered email"
                autoComplete="email"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-3 pl-10 pr-4 text-base text-[var(--text-main)] placeholder:text-[var(--text-body)] placeholder:opacity-80 outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <p className="text-sm text-[var(--text-body)]">
              We&apos;ll send a 6-digit verification code to this email.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="otp" className="text-sm font-semibold text-[var(--text-main)]">
                Verification code
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="text-sm font-semibold text-[var(--primary)] transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendLoading
                  ? "Sending..."
                  : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"}
              </button>
            </div>
            <div className="relative">
              <KeyRound
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-body)]"
              />
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(next);
                  clearMessages();
                }}
                placeholder="Enter 6-digit OTP from your email"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-3 pl-10 pr-4 text-base text-[var(--text-main)] placeholder:text-[var(--text-body)] placeholder:opacity-80 outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <p className="text-sm text-[var(--text-body)]">
              Check your inbox and spam folder if you don&apos;t see the email.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-semibold text-[var(--text-main)]">
              New password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-body)]"
              />
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearMessages();
                }}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-3 pl-10 pr-4 text-base text-[var(--text-main)] placeholder:text-[var(--text-body)] placeholder:opacity-80 outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--text-main)]">
              Confirm new password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-body)]"
              />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearMessages();
                }}
                placeholder="Re-enter the new password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] py-3 pl-10 pr-4 text-base text-[var(--text-main)] placeholder:text-[var(--text-body)] placeholder:opacity-80 outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {!isSubmitDisabled && !error && (
            <p className="text-sm text-[var(--text-main)]">
              Looks good. You can now reset your password securely.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm font-medium text-[var(--text-main)] border-l-4 border-[var(--primary)] pl-3"
            >
              {error}
            </p>
          )}

          {success && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-main)]"
            >
              <CircleCheck size={16} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] px-5 py-3 text-base font-semibold text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)]"
            >
              <ArrowLeft size={18} />
              Back to login
            </Link>

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-base font-semibold text-[var(--text-on-primary)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <CircleCheck size={18} />
                  Reset password
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-5 text-sm text-[var(--text-body)]">
          For security, this link and OTP will expire after a short time. You can always request a new code if needed.
        </p>

        <p className="mt-4 text-center text-base text-[var(--text-body)]">
          Remembered your password?{" "}
          <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Log in instead
          </Link>
        </p>
      </div>
    </div>
  );
}
