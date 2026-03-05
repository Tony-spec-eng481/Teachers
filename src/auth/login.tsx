import React, { useState } from "react";
import { useAuth } from "../shared";
import { useNavigate, Link } from "react-router-dom";
import { axiosInstance as api } from "../shared";
import toast from "react-hot-toast";
import { AuthLayout } from "../shared";
import { Eye, EyeOff } from "lucide-react";
import "../shared/styles/auth/form.css";

const TeacherLogin = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { userId, password });
      const { accessToken, user } = response.data;

      if (user.role !== "teacher") {
        toast.error("Unauthorized. This login is for Teachers.");
        return;
      }

      login(accessToken, user);
      toast.success("Welcome back, Teacher!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      mode="login"
      role="teacher"
      onToggleMode={() => navigate("/auth/register")}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group-custom">
          <input
            type="text"
            className="auth-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Teacher ID (e.g. TCH/0001/2026)"
            required
          />
        </div>
        <div className="form-group-custom password-field">
          <input
            type={showPassword ? "text" : "password"}
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="auth-options">
          <label className="auth-checkbox-group">
            <input type="checkbox" className="auth-checkbox" />
            Remember me
          </label>
          <Link to="/auth/forgot-password" className="auth-forgot-link">
            Forgot Password?
          </Link>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="loading-text">
              <span className="spinner"></span>
              LOGGING IN...
            </span>
          ) : (
            "LOGIN"
          )}
        </button>
        <Link to="/" className="auth-forgot-link">
          Back Home
        </Link>
      </form>
    </AuthLayout>
  );
};

export default TeacherLogin;
