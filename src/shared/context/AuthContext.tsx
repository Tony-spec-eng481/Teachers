import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {   
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthContextType {
  user: User | null;  
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Verify token or get user profile if needed
          // For now, we trust the local storage, but ideally we verify with backend
          const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
            console.error(error);
            logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = React.useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  }, []);

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  // Idle timeout logic: 15 minutes
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const INACTIVITY_LIMIT = 15 * 60 * 1000;

    const handleInactivity = () => logout();

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (token) {
        timeoutId = setTimeout(handleInactivity, INACTIVITY_LIMIT);
      }
    };

    if (token) {
      resetTimer();
      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      if (typeof window !== 'undefined') {
        events.forEach(event => window.addEventListener(event, resetTimer));

        return () => {
          clearTimeout(timeoutId);
          events.forEach(event => window.removeEventListener(event, resetTimer));
        };
      }
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
