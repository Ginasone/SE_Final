/**
 * Implements route protection using the Guard pattern.
 * Ensures that only authenticated users with appropriate roles
 * can access protected pages.
 * 
 * @author Nadia
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['student', 'teacher', 'admin'] 
}) => {
  const { user, isLoading, checkAuth } = useAuth();
  const router = useRouter();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Only attempt redirection once to prevent loops
    if (!redirectAttempted) {
      const verifyAuth = async () => {
        setRedirectAttempted(true);
        
        // Only if we're absolutely sure auth has failed, redirect to login
        const isAuthenticated = await checkAuth();
        
        if (!isAuthenticated && !isLoading) {
          // Use replace instead of push to avoid browser history stacking
          router.replace('/auth');
        }
      };

      verifyAuth();
    }
  }, [checkAuth, router, isLoading, redirectAttempted]);

  // Show a simple loading state instead of redirecting infinitely
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-xl">Loading...</p>
        
        {/* Add a debug message that only appears during development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-yellow-100 p-3 rounded-lg border border-yellow-300 text-xs max-w-sm">
            <p className="font-bold">Debug: Auth Check</p>
            <p>Authentication verification in progress.</p>
            <p>API status: {redirectAttempted ? 'Attempted' : 'Pending'}</p>
            <p>If this persists, check your auth API endpoints.</p>
          </div>
        )}
      </div>
    );
  }

  // If user is authenticated and authorized, render children
  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // If verification completed but user isn't authenticated, show a message
  // instead of infinite redirects
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-6">Please log in to access this page.</p>
          <button
            onClick={() => router.replace('/auth')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Return null while redirecting
  return null;
};

export default ProtectedRoute;