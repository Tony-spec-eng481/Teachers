
import React from 'react';
import '../styles/auth/Auth.css';
import { BookOpen } from 'lucide-react';
import Picture from '../assets/Picture1.jpg';

interface AuthLayoutProps {
  children: React.ReactNode;
  mode: 'login' | 'register' | 'forgot-password' | 'reset-password';
  role: 'student' | 'teacher' | 'admin';
  onToggleMode: () => void;
}

const modeHeadings: Record<string, string> = {
  'forgot-password': 'FORGOT PASSWORD',
  'reset-password': 'RESET PASSWORD',
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, mode, onToggleMode }) => {
  const isAuthFlow = mode === 'forgot-password' || mode === 'reset-password';

  return (
    <div className="auth-container">
      {/* Left Side - Branding */}
      <div className="auth-left">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <BookOpen size={32} color="#0056D2" />
            <h2>TRESPICS SCHOOL</h2>
          </div>

          <h1 className="auth-headline">BUILD YOUR BRIGHT FUTURE</h1>

          <div className="testimonial">
            <img
              src={Picture}
              alt="User"
              className="testimonial-avatar"
            />
            <div className="testimonial-content">
              <p>
                "The academic structure here truly prepares students for
                real-world success."
              </p>
              <span>- John W., Teacher</span>
              <p className="text-xs mt-1">
                Trespics focuses on discipline, innovation, and growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-right-logo">
            <BookOpen size={24} color="white" />
            <span>TRESPICS SCHOOL</span>
          </div>

          {isAuthFlow ? (
            <div className="auth-mode-heading">
              <h2>{modeHeadings[mode]}</h2>
            </div>
          ) : (
            <div className="auth-toggle">
              <button
                className={`auth-toggle-btn ${mode === "login" ? "active" : ""}`}
                onClick={mode === "register" ? onToggleMode : undefined}
              >
                LOGIN
              </button>
              <button
                className={`auth-toggle-btn ${mode === "register" ? "active" : ""}`}
                onClick={mode === "login" ? onToggleMode : undefined}
              >
                REGISTER
              </button>
            </div>
          )}

          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
