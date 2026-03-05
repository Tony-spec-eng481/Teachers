import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import toast from "react-hot-toast";
import AuthLayout from "../layouts/AuthLayout";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import "../styles/auth/form.css";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      setIsSubmitted(true);
      toast.success("Reset link sent! Check your email.");
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Failed to send reset link. Try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      mode="forgot-password"
      role="student"
      onToggleMode={() => navigate("/auth/login")}
    >
      {isSubmitted ? (
        <div className="auth-form">
          <div className="auth-success-state">
            <CheckCircle size={48} className="auth-success-icon" />
            <h3 className="auth-success-title">Check Your Email</h3>
            <p className="auth-success-message">
              If an account with <strong>{email}</strong> exists, we've sent a
              password reset link. Please check your inbox and spam folder.
            </p>
            <button
              className="auth-submit-btn"
              onClick={() => navigate("/auth/login")}
            >
              BACK TO LOGIN
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <p className="auth-form-description">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <div className="form-group-custom">
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="auth-input auth-input-with-icon"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                SENDING...
              </span>
            ) : (
              "SEND RESET LINK"
            )}
          </button>

          <button
            type="button"
            className="auth-back-btn"
            onClick={() => navigate("/auth/login")}
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
