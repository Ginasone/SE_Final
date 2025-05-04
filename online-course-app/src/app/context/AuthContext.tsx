/**
 * Implements the Authentication Context Provider using the Observer pattern.
 * Manages global authentication state and provides authentication-related
 * functionality to the entire application.
 * 
 * @author Nadia
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define user types for the app
export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school_id?: number;
  school_name?: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: () => {},
  checkAuth: async () => false
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add a flag to prevent infinite loops
  const [authCheckAttempted, setAuthCheckAttempted] = useState(false);
  
  // Check if user is authenticated on component mount (once only)
  useEffect(() => {
    const initAuth = async () => {
      if (!authCheckAttempted) {
        setAuthCheckAttempted(true);
        await checkAuth();
      }
    };
    
    initAuth();
  }, [authCheckAttempted]);

  // Check authentication status without redirecting
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem('user-token');
      
      if (!storedToken) {
        console.log("No token found in localStorage");
        setIsLoading(false);
        return false;
      }

      // Verify token with backend - use a try/catch to handle failed requests
      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (!response.ok) {
          console.log(`Token validation failed with status: ${response.status}`);
          // If token is invalid, clear storage but don't redirect
          if (response.status === 401) {
            localStorage.removeItem('user-token');
            localStorage.removeItem('user-id');
            localStorage.removeItem('user-role');
            localStorage.removeItem('user-school-id');
            localStorage.removeItem('user-school-name');
          }
          
          setIsLoading(false);
          return false;
        }

        // Get user data
        const userData = await response.json();
        console.log("User data retrieved:", userData);
        
        // Set auth state
        setToken(storedToken);
        setUser({
          id: userData.id,
          name: userData.full_name,
          email: userData.email,
          role: userData.role,
          school_id: userData.school_id,
          school_name: userData.school_name
        });
        
        // Store user ID and role for future use
        localStorage.setItem('user-id', userData.id.toString());
        localStorage.setItem('user-role', userData.role);
        
        // Also store school ID if available
        if (userData.school_id) {
          localStorage.setItem('user-school-id', userData.school_id.toString());
          if (userData.school_name) {
            localStorage.setItem('user-school-name', userData.school_name);
          }
        }
        
        setIsLoading(false);
        return true;
      } catch (err) {
        console.error('API request error:', err);
        // Don't set error state, just return false to avoid redirects
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setError('Authentication check failed');
      setIsLoading(false);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data
      localStorage.setItem('user-token', data.token);
      localStorage.setItem('user-id', data.user.id.toString());
      localStorage.setItem('user-role', data.user.role);
      
      // Save school info if available
      if (data.user.school_id) {
        localStorage.setItem('user-school-id', data.user.school_id.toString());
        if (data.user.school_name) {
          localStorage.setItem('user-school-name', data.user.school_name);
        }
      }

      // Update state
      setToken(data.token);
      setUser(data.user);

      // Set cookie for server-side auth
      document.cookie = `token=${data.token}; path=/; max-age=${60 * 60 * 24}`; // 1 day expiry
      
      // Redirect to appropriate dashboard based on user role
      if (data.dashboardPath) {
        router.push(data.dashboardPath);
      } else {
        // Fallback redirect logic
        switch (data.user.role) {
          case 'admin':
            router.push('/admin-dashboard');
            break;
          case 'teacher':
            router.push('/teacher-dashboard');
            break;
          default:
            router.push('/student-dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear auth state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user-token');
    localStorage.removeItem('user-id');
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-school-id');
    localStorage.removeItem('user-school-name');
    
    // Clear cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    
    // Redirect to login
    router.push('/auth');
  };

  // Provide auth context
  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      error,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;