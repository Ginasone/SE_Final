/**
 * Student Dashboard Page Component
 * 
 * Main dashboard for students. 
 * @author Nadia
 */


'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


interface Course {
  id: number;
  title: string;
  description: string;
  teacher_name: string | null;
  school_name: string | null;
  status: string;
}

const StudentDashboard = () => {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [_studentId, setStudentId] = useState<number | null>(null);
    const [coursesCount, setCoursesCount] = useState(0);

    // Authentication check and data loading
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check for token first - if no token, redirect immediately
                const token = localStorage.getItem('user-token');
                if (!token) {
                    router.replace('/auth');
                    return;
                }
                
                // Get user ID from localStorage
                const userId = localStorage.getItem('user-id');
                if (userId) {
                    const parsedId = parseInt(userId, 10);
                    if (!isNaN(parsedId)) {
                        setStudentId(parsedId);
                        await fetchCourses(parsedId);
                        return;
                    }
                }
                
                // No valid user ID found, redirect to login
                router.replace('/auth');
            } catch (error) {
                console.error("Auth check error:", error);
                setError("Authentication error. Please log in again.");
                router.replace('/auth');
            } finally {
                setIsLoading(false);
            }
        };
        
        checkAuth();
    }, [router]);

    // Fetch courses for the student
    const fetchCourses = async (id: number) => {
        try {
            setIsLoading(true);
            
            // Fetch courses from API
            const response = await fetch(`/api/student/courses?studentId=${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('user-token')}`
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Handle authentication error
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error(`Failed to fetch courses: ${response.statusText}`);
            }
            
            const data = await response.json();
            setCourses(data);
            setCoursesCount(data.length);
            
        } catch (err) {
            console.error("Error fetching courses:", err);
            setError(err instanceof Error ? err.message : 'Failed to load courses');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('user-token');
        localStorage.removeItem('user-id');
        localStorage.removeItem('user-role');
        localStorage.removeItem('user-school-id');
        router.push('/auth');
    };

    // Navigate to course details
    const navigateToCourse = (courseId: number) => {
        router.push(`/courses/${courseId}`);
    };

    // Browse available courses
    const browseCourses = () => {
        router.push('/courses/browse');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <button 
                        onClick={handleLogout}
                        className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 p-4 md:p-8">
            {/* Header with Logout */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
                <div className="flex gap-4">
                    <button 
                        onClick={browseCourses}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                    >
                        Browse Courses
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Course Stats */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">My Learning</h2>
                <p className="text-3xl font-bold text-primary">{coursesCount} Courses Enrolled</p>
            </div>

            {/* Course Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center">
                        <p className="text-gray-500 mb-4">You are not enrolled in any courses yet.</p>
                        <button 
                            onClick={browseCourses}
                            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
                        >
                            Browse Available Courses
                        </button>
                    </div>
                ) : (
                    courses.map(course => (
                        <div 
                            key={course.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => navigateToCourse(course.id)}
                        >
                            <div className="h-3 bg-primary"></div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">Teacher:</span> {course.teacher_name || 'Not assigned'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium">School:</span> {course.school_name || 'Not specified'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        course.status === 'published' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {course.status}
                                    </span>
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