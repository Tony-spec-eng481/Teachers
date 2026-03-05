// Auth
export { AuthProvider, useAuth } from './context/AuthContext';
export { default as ProtectedRoute } from './components/ProtectedRoute';

// API
export { default as axiosInstance } from './api/axios';

// Layouts
export { default as AuthLayout } from './layouts/AuthLayout';

// Pages
export { default as ForgotPassword } from './pages/ForgotPassword';
export { default as ResetPassword } from './pages/ResetPassword';

// Components
export { default as Footer } from './components/Footer';
export { default as CourseCard } from './components/CourseCard';
export { default as SEO } from './components/SEO';

// Styles
import './styles/auth/style.css';
import './App.css';
