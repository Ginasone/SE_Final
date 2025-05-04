/**
 * Courses Layout Component
 * 
 * Provides a wrapper for all course-related pages to ensure authentication
 * and consistent layout.
 * 
 * Uses the Decorator pattern to enhance the base layout with authentication.
 */

'use client';

import React from 'react';
import ProtectedRoute from '@/app/context/ProtectedRoute';

/**
 * Layout wrapper for course pages
 * Ensures users are authenticated and provides consistent layout
 */
export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Apply Protected Route pattern to ensure authentication
    <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
      {/* Main content wrapper */}
      <div className="min-h-screen bg-blue-50 dark:bg-gray-900">
        {children}
      </div>
    </ProtectedRoute>
  );
}