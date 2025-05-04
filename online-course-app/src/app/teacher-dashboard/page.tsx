'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUsers, FaBookOpen, FaChalkboardTeacher, FaUserGraduate } from 'react-icons/fa';

interface Course {
    id: number;
    title: string;
    description: string;
    school_id: number | null;
    school_name?: string;
    teacher_id: number | null;
    teacher_name?: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'published' | 'archived';
    student_count?: number;
    created_at: string;
}

interface Student {
    id: number;
    full_name: string;
    email: string;
    status: 'active' | 'inactive';
    joined_date: string;
}

interface Enrollment {
    id: number;
    course_id: number;
    student_id: number;
    enrollment_date: string;
    student: Student;
}

const TeacherDashboardPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [error, setError] = useState('');

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('user-token');
            const userRole = localStorage.getItem('user-role');

            if (!token) {
                router.push('/auth');
                return;
            }

            if (userRole !== 'teacher') {
                const dashboardPath = userRole === 'admin' ? '/admin-dashboard' : '/student-dashboard';
                router.push(dashboardPath);
                return;
            }

            try {
                // Fetch courses
                const response = await fetch('/api/teacher/courses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch courses');
                }
                
                const data = await response.json();
                setCourses(data.courses || []);
                
                if (data.courses && data.courses.length > 0) {
                    setSelectedCourseId(data.courses[0].id);
                }
            } catch (err) {
                console.error('Error:', err);
                setError('Failed to load courses');
            } finally {
                setIsLoading(false);
            }
        };
        
        checkAuth();
    }, [router]);

    // Fetch enrollments when course changes
    useEffect(() => {
        const fetchEnrollments = async () => {
            if (!selectedCourseId) return;
            
            try {
                const token = localStorage.getItem('user-token');
                const response = await fetch(`/api/teacher/courses/${selectedCourseId}/enrollments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch enrollments');
                }
                
                const data = await response.json();
                setEnrollments(data.enrollments || []);
            } catch (err) {
                console.error('Error:', err);
                setError('Failed to load student enrollments');
            }
        };
        
        fetchEnrollments();
    }, [selectedCourseId]);

    const handleCourseSelect = (courseId: number) => {
        setSelectedCourseId(courseId);
    };

    const totalStudents = courses.reduce((sum, course) => sum + (course.student_count || 0), 0);
    const selectedCourse = courses.find(course => course.id === selectedCourseId);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 dark:bg-gray-900 p-6">
            <div className="container mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Teacher Dashboard</h1>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                        <button
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                            onClick={() => setError('')}
                        >
                            <span className="sr-only">Close</span>
                            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                            </svg>
                        </button>
                    </div>
                )}
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">My Courses</h2>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{courses.length}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900">
                            <FaBookOpen className="text-3xl text-primary dark:text-blue-300" />
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Total Students</h2>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{totalStudents}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900">
                            <FaUserGraduate className="text-3xl text-primary dark:text-blue-300" />
                        </div>
                    </div>
                </div>
                
                {/* Courses and Students Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Course List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-1">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <FaChalkboardTeacher className="mr-2" />
                            My Courses
                        </h2>
                        
                        {courses.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">You haven&apos;t been assigned to any courses yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {courses.map(course => (
                                    <div 
                                        key={course.id}
                                        className={`p-4 rounded-md cursor-pointer transition-colors ${
                                            selectedCourseId === course.id 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                        onClick={() => handleCourseSelect(course.id)}
                                    >
                                        <h3 className={`font-medium ${selectedCourseId === course.id ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                                            {course.title}
                                        </h3>
                                        <div className={`text-sm ${selectedCourseId === course.id ? 'text-white opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {course.school_name || 'No school assigned'}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className={`text-sm flex items-center ${selectedCourseId === course.id ? 'text-white opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                                                <FaUserGraduate className="mr-1" />
                                                {course.student_count || 0} students
                                            </div>
                                            <div className={`text-xs px-2 py-1 rounded-full ${
                                                selectedCourseId === course.id
                                                ? 'bg-white text-primary'
                                                : course.status === 'published'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : course.status === 'draft'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {course.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Student List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-2">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <FaUsers className="mr-2" />
                            {selectedCourse ? `Students in ${selectedCourse.title}` : 'Students'}
                        </h2>
                        
                        {!selectedCourseId ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">Please select a course to view students.</p>
                            </div>
                        ) : enrollments.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">No students enrolled in this course.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">Student Name</th>
                                            <th className="py-3 px-6 text-left">Email</th>
                                            <th className="py-3 px-6 text-left">Status</th>
                                            <th className="py-3 px-6 text-left">Joined Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 dark:text-gray-300 text-sm">
                                        {enrollments.map(enrollment => (
                                            <tr key={enrollment.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="py-3 px-6 text-left">{enrollment.student.full_name}</td>
                                                <td className="py-3 px-6 text-left">{enrollment.student.email}</td>
                                                <td className="py-3 px-6 text-left">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        enrollment.student.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                        {enrollment.student.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboardPage;