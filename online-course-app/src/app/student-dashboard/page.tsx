'use client';

import React, { useState } from "react";
import { useStudentDashboard } from "./hooks/useStudentDashboard";

const StudentDashboard = () => {
    // Set the student ID (in production, get this from auth context)
    const studentId = 7; // Hardcoded for Georgina's ID from your database
    
    // Use the custom hook to fetch all data
    const {
        profile,
        stats,
        courses,
        notifications,
        isLoading,
        error,
        markNotificationAsRead,
        refreshData
    } = useStudentDashboard(studentId);

    // Handle logout (in production, use your auth context)
    const handleLogout = () => {
        console.log("Logging out...");
        // Future implementation: authContext.logout();
        // window.location.href = "/login";
    };

    // Show loading state while data is being fetched
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <p className="text-xl">Loading dashboard...</p>
            </div>
        );
    }

    // Show error state if data fetching failed
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="bg-red-100 p-4 rounded-lg">
                    <p className="text-red-700">Error: {error}</p>
                    <button 
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={refreshData}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-blue-50">
            {/*Sidebar for Navigation*/}
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
                                <p className="text-sm text-gray-500">{profile.school_name}</p>
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

            {/*Main Section*/}
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center pb-4 mb-6">
                    <h1 className="text-4xl text-gray-500 font-normal">Dashboard</h1>
                    <button className="text-2xl text-gray-500">⋮</button>
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
        </div>
    );
};

export default StudentDashboard;