/**
 * Student Dashboard Layout
 * 
 * Wrapper component that provides route protection for the student dashboard.
 * Ensures that only authenticated students can access the dashboard.
 * 
 * @author Nadia
 */

'use client';

import React from 'react';
import ProtectedRoute from '../context/ProtectedRoute';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      {children}
    </ProtectedRoute>
  );
}