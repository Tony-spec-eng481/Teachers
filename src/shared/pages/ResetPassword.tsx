import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axios";
import toast from "react-hot-toast";
import AuthLayout from "../layouts/AuthLayout";
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import "../styles/auth/form.css";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setIsSuccess(true);
      toast.success("Password reset successful!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
          "Failed to reset password. The link may have expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // No token provided — invalid link
  if (!token) {
    return (
      <AuthLayout
        mode="reset-password"
        role="student"
        onToggleMode={() => navigate("/auth/login")}
      >
        <div className="auth-form">
          <div className="auth-error-state">
            <AlertTriangle size={48} className="auth-error-icon" />
            <h3 className="auth-error-title">Invalid Reset Link</h3>
            <p className="auth-error-message">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
            <button
              className="auth-submit-btn"
              onClick={() => navigate("/auth/forgot-password")}
            >
              REQUEST NEW LINK
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="reset-password"
      role="student"
      onToggleMode={() => navigate("/auth/login")}
    >
      {isSuccess ? (
        <div className="auth-form">
          <div className="auth-success-state">
            <CheckCircle size={48} className="auth-success-icon" />
            <h3 className="auth-success-title">Password Reset!</h3>
            <p className="auth-success-message">
              Your password has been successfully reset. You can now login with
              your new password.
            </p>
            <button
              className="auth-submit-btn"
              onClick={() => navigate("/auth/login")}
            >
              GO TO LOGIN
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <p className="auth-form-description">
            Enter your new password below.
          </p>

          <div className="form-group-custom password-field">
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input auth-input-with-icon"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 6 characters)"
                required
                minLength={6}
                autoFocus
              />
            </div>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="form-group-custom password-field">
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="auth-input auth-input-with-icon"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                RESETTING...
              </span>
            ) : (
              "RESET PASSWORD"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
