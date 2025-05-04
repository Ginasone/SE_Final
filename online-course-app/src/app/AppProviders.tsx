/**
 * A container for all context providers in the application.
 * Using the Composite pattern to organize multiple providers.
 * 
 * @author Nadia
 */

'use client';

import React from 'react';
import { AuthProvider } from './context/AuthContext';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}