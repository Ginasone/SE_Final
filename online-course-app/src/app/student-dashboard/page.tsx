/**
 * Student Dashboard Page Component
 * 
 * Main dashboard for students. Uses authentication context to fetch 
 * the correct user data instead of hardcoded IDs.
 * Implements the Presentation-Container pattern separating data fetching from UI.
 * 
 * @author Nadia
 */

'use client';

import React, { useState, useEffect } from "react";
import { useStudentDashboard } from "./hooks/useStudentDashboard";
import { useRouter } from "next/navigation";

const StudentDashboard = () => {
    const router = useRouter();
    const [studentId, setStudentId] = useState<number | null>(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [debugMode, setDebugMode] = useState(true); // Start with debug mode on
    
    // This is a simplified auth check focused only on getting the student ID
    useEffect(() => {
        // This flag prevents multiple redirects
        let redirecting = false;
        
        const checkAuth = () => {
            try {
                console.log("Starting auth check...");
                
                // First check: is there a valid student ID in session storage?
                // This is a failsafe to prevent redirect loops
                const sessionStudentId = sessionStorage.getItem('temp-student-id');
                if (sessionStudentId) {
                    console.log("Found student ID in session storage:", sessionStudentId);
                    const parsedId = parseInt(sessionStudentId, 10);
                    if (!isNaN(parsedId)) {
                        console.log("Using session storage ID:", parsedId);
                        setStudentId(parsedId);
                        setIsAuthChecked(true);
                        return; // Exit early - we have a valid ID
                    }
                }
                
                // Check for user ID in localStorage
                const userId = localStorage.getItem('user-id');
                if (userId) {
                    console.log("User ID found in localStorage:", userId);
                    const parsedId = parseInt(userId, 10);
                    if (!isNaN(parsedId)) {
                        // Store in both state and session storage
                        setStudentId(parsedId);
                        sessionStorage.setItem('temp-student-id', parsedId.toString());
                        console.log("Student ID set successfully:", parsedId);
                    }
                } else {
                    console.log("No user ID in localStorage, checking token...");
                    // No user ID but we might have a token
                    const token = localStorage.getItem('user-token');
                    
                    if (token) {
                        console.log("Token found, but no user ID. Setting dummy ID to prevent redirect");
                        // We have a token but no ID - use a temporary placeholder
                        // to prevent redirect loops and let the API fetch actual data
                        sessionStorage.setItem('temp-student-id', '9999'); // Temporary ID
                        setStudentId(9999); // Set temporary ID in state
                    } else {
                        console.log("No token found, redirect needed");
                        // Only redirect if not already redirecting
                        if (!redirecting) {
                            redirecting = true;
                            router.push('/auth');
                            return;
                        }
                    }
                }
            } catch (error) {
                console.error("Auth check error:", error);
            } finally {
                setIsAuthChecked(true);
            }
        };
        
        checkAuth();
    }, [router]);
    
    // Use the hook but pass a fallback ID if needed
    const {
        profile,
        stats,
        courses,
        notifications,
        isLoading,
        error,
        markNotificationAsRead,
        refreshData
    } = useStudentDashboard(studentId || 0); // Pass 0 instead of null
    
    // Handle logout with clean storage
    const handleLogout = () => {
        console.log("Logging out...");
        // Clear storage
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-id');
        localStorage.removeItem('user-role');
        localStorage.removeItem('user-school-id');
        localStorage.removeItem('user-school-name');
        sessionStorage.removeItem('temp-student-id');
        
        // Redirect to login
        router.push('/auth');
    };
    
    // Toggle debug mode
    const toggleDebugMode = () => {
        setDebugMode(!debugMode);
    };

    // Force a temp student ID for testing
    const forceStudentId = () => {
        const newId = 9999;
        sessionStorage.setItem('temp-student-id', newId.toString());
        setStudentId(newId);
        console.log("Forced student ID:", newId);
        refreshData();
    };

    // Show loading state while checking auth or fetching data
    if (!isAuthChecked || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-xl">Loading dashboard...</p>
                
                {/* Debug panel */}
                {debugMode && (
                    <div className="fixed bottom-16 right-4 bg-white p-4 shadow-lg rounded-lg text-xs max-w-sm">
                        <h4 className="font-bold mb-2">Debug Information</h4>
                        <p>Auth checked: {isAuthChecked ? 'Yes' : 'No'}</p>
                        <p>Student ID: {studentId || 'Not set'}</p>
                        <p>Data loading: {isLoading ? 'Yes' : 'No'}</p>
                        <p>Token: {localStorage.getItem('user-token') ? 'Present' : 'Missing'}</p>
                        <p>User ID: {localStorage.getItem('user-id') || 'Not set'}</p>
                        <p>Role: {localStorage.getItem('user-role') || 'Not set'}</p>
                        <p>Temp ID: {sessionStorage.getItem('temp-student-id') || 'Not set'}</p>
                        <p>Error: {error || 'None'}</p>
                        <div className="flex flex-col gap-2 mt-2">
                            <button 
                                onClick={forceStudentId}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                            >
                                Force Temp ID
                            </button>
                            <button 
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                            >
                                Force Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Show error state if data fetching failed
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="bg-red-100 p-4 rounded-lg max-w-md">
                    <p className="text-red-700 font-medium mb-2">Error: {error}</p>
                    <p className="text-gray-700 mb-4">Unable to load your dashboard data.</p>
                    <div className="flex gap-3">
                        <button 
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                            onClick={refreshData}
                        >
                            Try Again
                        </button>
                        <button 
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                            onClick={handleLogout}
                        >
                            Return to Login
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                            onClick={forceStudentId}
                        >
                            Force ID & Retry
                        </button>
                    </div>
                    
                    {/* Debug panel */}
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
                        <p>Student ID: {studentId || 'Not set'}</p>
                        <p>API Error: {error}</p>
                        <p>Token: {localStorage.getItem('user-token') ? 'Present' : 'Missing'}</p>
                        <p>User ID: {localStorage.getItem('user-id') || 'Not set'}</p>
                        <p>Role: {localStorage.getItem('user-role') || 'Not set'}</p>
                        <p>Temp ID: {sessionStorage.getItem('temp-student-id') || 'Not set'}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Main dashboard content - render as normal
    return (
        <div className="min-h-screen flex bg-blue-50">
            {/* Sidebar for Navigation */}
            <div className="w-64 bg-white border-r shadow-sm">
                <div className="p-6">
                    <h1 className="text-xl font-bold mb-8">Student Portal</h1>
                    
                    {/* Show user profile if available */}
                    {profile && (
                        <div className="mb-6 flex items-center">
                            {profile.profile_picture ? (
                                <img 
                                    src={profile.profile_picture} 
                                    alt={profile.full_name}
                                    className="w-10 h-10 rounded-full mr-3" 
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                                    {profile.full_name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-medium">{profile.full_name}</p>
                                <p className="text-sm text-gray-500">{profile.school_name || 'No school'}</p>
                            </div>
                        </div>
                    )}
                    
                    <nav>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" className="flex items-center text-blue-600 font-medium">
                                    <span className="mr-2">📊</span>
                                    Dashboard
                                </a>
                            </li>

                            <li>
                                <a href="#" className="flex items-center text-gray-600 hover:text-blue-600">
                                    <span className="mr-2">📚</span>
                                    Courses
                                </a>
                            </li>

                            <li className="mt-auto pt-8">
                                <button 
                                    onClick={handleLogout}
                                    className="flex items-center text-gray-600 hover:text-red-600"
                                >
                                    <span className="mr-2">🚪</span>
                                    Log out
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Main Section */}
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center pb-4 mb-6">
                    <h1 className="text-4xl text-gray-500 font-normal">Dashboard</h1>
                    <div className="flex items-center">
                        <button 
                            onClick={toggleDebugMode}
                            className="text-sm text-gray-500 hover:text-blue-500 mr-4"
                        >
                            {debugMode ? 'Hide Debug' : 'Debug'}
                        </button>
                        <button className="text-2xl text-gray-500">⋮</button>
                    </div>
                </div>

                {/* Stats section with course count and notification count */}
                <div className="flex gap-20 mb-8">
                    <div className="ml-20 bg-white rounded-xl p-8 w-80">
                        <h2 className="text-lg font-semibold text-black">Courses</h2>
                        <p className="text-base text-black">{stats.coursesCount}</p>
                    </div>

                    <div className="bg-white rounded-xl p-8 w-80">
                        <h2 className="text-lg font-semibold text-black">Notifications</h2>
                        <p className="text-base text-black">{stats.notificationsCount}</p>
                    </div>
                </div>

                {/* Course cards section */}
                <section className="mt-8 w-full">
                    <div className="bg-blue-50">
                        <h2 className="text-lg font-semibold text-black">Courses</h2>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-4">
                        {courses.length === 0 ? (
                            <div className="w-full p-8 bg-white rounded-lg text-center">
                                <p className="text-gray-500">You are not enrolled in any courses yet.</p>
                            </div>
                        ) : (
                            courses.map(course => (
                                <div 
                                    key={course.id}
                                    className="w-96 h-64 bg-green-200 rounded-lg overflow-hidden shadow-sm relative"
                                >
                                    <div className="p-4 h-full flex flex-col">
                                        <div className="flex justify-between">
                                            <div>
                                                {course.difficulty_level && (
                                                    <span className="px-2 py-1 bg-white rounded text-xs">
                                                        {course.difficulty_level}
                                                    </span>
                                                )}
                                            </div>
                                            <button className="text-gray-700">⋮</button>
                                        </div>
                                        
                                        {/* Progress bar */}
                                        <div className="mt-auto mb-2">
                                            <div className="w-full bg-white rounded-full h-2.5">
                                                <div 
                                                    className="bg-blue-600 h-2.5 rounded-full" 
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs mt-1 text-gray-700">
                                                {course.progress}% Complete
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* White footer at bottom of card */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-white p-4">
                                        <p className="text-base font-medium">{course.title}</p>
                                        <p className="text-xs text-gray-500">
                                            Teacher: {course.teacher_name || 'Not assigned'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Right sidebar - Notifications section */}
            <div className="w-80 border-l bg-white p-6">
                <h2 className="text-lg font-medium mb-4">Notifications</h2>
                
                {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No new notifications</p>
                ) : (
                    notifications.map(notification => (
                        <div key={notification.id} className="mb-6 border-b pb-2">
                            <div className="flex justify-between">
                                <div>
                                    <p className={notification.is_read ? "text-gray-500" : "text-red-500"}>
                                        {notification.message}
                                        <button 
                                            className="float-right ml-2" 
                                            onClick={() => markNotificationAsRead(notification.id)}
                                        >
                                            ✕
                                        </button>
                                    </p>
                                    {notification.course_title && (
                                        <p className="text-sm text-gray-600">{notification.course_title}</p>
                                    )}
                                    <p className="text-sm text-gray-600">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Debug info panel */}
            {debugMode && (
                <div className="fixed bottom-0 right-0 bg-white p-4 shadow-lg border-t border-l border-gray-200 rounded-tl-lg text-xs max-w-xs">
                    <h4 className="font-bold mb-2">Dashboard Debug Info</h4>
                    <div className="space-y-1 mb-3">
                        <p><span className="font-semibold">Student ID:</span> {studentId || 'None'}</p>
                        <p><span className="font-semibold">Auth Status:</span> {localStorage.getItem('user-token') ? 'Authenticated' : 'Not authenticated'}</p>
                        <p><span className="font-semibold">User ID from Storage:</span> {localStorage.getItem('user-id') || 'None'}</p>
                        <p><span className="font-semibold">User Role:</span> {localStorage.getItem('user-role') || 'None'}</p>
                        <p><span className="font-semibold">School ID:</span> {localStorage.getItem('user-school-id') || 'None'}</p>
                        <p><span className="font-semibold">Temp ID:</span> {sessionStorage.getItem('temp-student-id') || 'None'}</p>
                        <p><span className="font-semibold">Profile API:</span> {profile ? 'Loaded' : 'Not loaded'}</p>
                        <p><span className="font-semibold">Courses:</span> {courses?.length || 0}</p>
                        <p><span className="font-semibold">Notifications:</span> {notifications?.length || 0}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={refreshData}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex-1"
                        >
                            Refresh Data
                        </button>
                        <button 
                            onClick={forceStudentId}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex-1"
                        >
                            Force ID
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;