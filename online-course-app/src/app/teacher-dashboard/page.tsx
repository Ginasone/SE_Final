'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBookReader, FaUsers, FaBookOpen, FaChalkboardTeacher, FaUserGraduate, 
         FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaVideo, FaFileAlt, FaLink } from 'react-icons/fa';

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

interface Lesson {
    id: number;
    course_id: number;
    title: string;
    content: string;
    video_url: string | null;
    position: number;
    created_at: string;
}

const TeacherDashboardPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'content'>('students');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Lesson form state
    const [showLessonForm, setShowLessonForm] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [lessonForm, setLessonForm] = useState({
        id: 0,
        title: '',
        content: '',
        video_url: '',
        position: 0
    });

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

    // Fetch lessons when course changes
    useEffect(() => {
        const fetchLessons = async () => {
            if (!selectedCourseId) return;
            
            try {
                const token = localStorage.getItem('user-token');
                const response = await fetch(`/api/teacher/courses/${selectedCourseId}/lessons`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch lessons');
                }
                
                const data = await response.json();
                setLessons(data.lessons || []);
            } catch (err) {
                console.error('Error:', err);
                setError('Failed to load course lessons');
            }
        };
        
        fetchLessons();
    }, [selectedCourseId]);

    const handleCourseSelect = (courseId: number) => {
        setSelectedCourseId(courseId);
        setActiveTab('students');
    };

    const handleAddLesson = () => {
        setLessonForm({
            id: 0,
            title: '',
            content: '',
            video_url: '',
            position: lessons.length + 1
        });
        setIsEditMode(false);
        setShowLessonForm(true);
    };

    const handleEditLesson = (lesson: Lesson) => {
        setLessonForm({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            video_url: lesson.video_url || '',
            position: lesson.position
        });
        setIsEditMode(true);
        setShowLessonForm(true);
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) {
            return;
        }

        try {
            const token = localStorage.getItem('user-token');
            const response = await fetch(`/api/teacher/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete lesson');
            }
            
            // Remove the lesson from state
            setLessons(lessons.filter(lesson => lesson.id !== lessonId));
            setSuccessMessage('Lesson deleted successfully');
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to delete lesson');
        }
    };

    const handleLessonFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedCourseId) {
            setError('No course selected');
            return;
        }

        if (!lessonForm.title) {
            setError('Lesson title is required');
            return;
        }

        try {
            const token = localStorage.getItem('user-token');
            const method = isEditMode ? 'PUT' : 'POST';
            const url = isEditMode 
                ? `/api/teacher/lessons/${lessonForm.id}`
                : `/api/teacher/courses/${selectedCourseId}/lessons`;
            
            const response = await fetch(url, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...lessonForm,
                    course_id: selectedCourseId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} lesson`);
            }
            
            const data = await response.json();
            
            if (isEditMode) {
                // Update the lesson in state
                setLessons(lessons.map(lesson => 
                    lesson.id === lessonForm.id ? {...data.lesson} : lesson
                ));
            } else {
                // Add the new lesson to state
                setLessons([...lessons, data.lesson]);
            }
            
            setSuccessMessage(`Lesson ${isEditMode ? 'updated' : 'added'} successfully`);
            setShowLessonForm(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Error:', err);
            setError(`Failed to ${isEditMode ? 'update' : 'add'} lesson`);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLessonForm(prev => ({
            ...prev,
            [name]: name === 'position' ? parseInt(value) || 0 : value
        }));
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
                
                {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{successMessage}</span>
                        <button
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                            onClick={() => setSuccessMessage('')}
                        >
                            <span className="sr-only">Close</span>
                            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
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
                
                {/* Courses and Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Course List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-1">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <FaChalkboardTeacher className="mr-2" />
                            My Courses
                        </h2>
                        
                        {courses.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">You haven't been assigned to any courses yet.</p>
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
                    
                    {/* Students and Content Tabs */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:col-span-2">
                        {/* No course selected message */}
                        {!selectedCourseId ? (
                            <div className="text-center py-16">
                                <p className="text-gray-500 dark:text-gray-400">Please select a course to view details.</p>
                            </div>
                        ) : (
                            <>
                                {/* Tab navigation */}
                                <div className="flex border-b mb-4">
                                    <button
                                        className={`py-2 px-4 font-medium ${
                                            activeTab === 'students'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                        onClick={() => setActiveTab('students')}
                                    >
                                        <FaUsers className="inline mr-2" />
                                        Students
                                    </button>
                                    <button
                                        className={`py-2 px-4 font-medium ${
                                            activeTab === 'content'
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                        onClick={() => setActiveTab('content')}
                                    >
                                        <FaBookReader className="inline mr-2" />
                                        Course Content
                                    </button>
                                </div>
                            
                                {/* Students Tab */}
                                {activeTab === 'students' && (
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                                            Students in {selectedCourse?.title}
                                        </h2>
                                        
                                        {enrollments.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-gray-500 dark:text-gray-400">No students enrolled in this course yet.</p>
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
                                )}
                                
                                {/* Content Tab */}
                                {activeTab === 'content' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                                                Course Content
                                            </h2>
                                            <button
                                                className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
                                                onClick={handleAddLesson}
                                            >
                                                <FaPlus className="mr-2" />
                                                Add Lesson
                                            </button>
                                        </div>
                                        
                                        {lessons.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <p className="text-gray-500 dark:text-gray-400 mb-4">No lessons added to this course yet.</p>
                                                <button
                                                    className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center mx-auto"
                                                    onClick={handleAddLesson}
                                                >
                                                    <FaPlus className="mr-2" />
                                                    Add First Lesson
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {lessons
                                                    .sort((a, b) => a.position - b.position)
                                                    .map(lesson => (
                                                    <div key={lesson.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center">
                                                                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                                                    {lesson.position}
                                                                </span>
                                                                <h3 className="font-medium text-gray-800 dark:text-white">{lesson.title}</h3>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleEditLesson(lesson)}
                                                                    className="text-blue-500 hover:text-blue-700"
                                                                    title="Edit lesson"
                                                                >
                                                                    <FaEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                    title="Delete lesson"
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                                            {lesson.content.length > 100 
                                                                ? lesson.content.substring(0, 100) + '...' 
                                                                : lesson.content}
                                                        </div>
                                                        
                                                        <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                            {lesson.video_url && (
                                                                <span className="flex items-center mr-3">
                                                                    <FaVideo className="mr-1" />
                                                                    Video
                                                                </span>
                                                            )}
                                                            <span className="flex items-center">
                                                                <FaFileAlt className="mr-1" />
                                                                Text Content
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Lesson Form Modal */}
            {showLessonForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            {isEditMode ? 'Edit Lesson' : 'Add New Lesson'}
                        </h2>
                        
                        <form onSubmit={handleLessonFormSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="title">
                                    Lesson Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={lessonForm.title}
                                    onChange={handleInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="content">
                                    Lesson Content
                                </label>
                                <textarea
                                    id="content"
                                    name="content"
                                    value={lessonForm.content}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                ></textarea>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="video_url">
                                    Video URL (optional)
                                </label>
                                <input
                                    type="url"
                                    id="video_url"
                                    name="video_url"
                                    value={lessonForm.video_url}
                                    onChange={handleInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="position">
                                    Lesson Position
                                </label>
                                <input
                                    type="number"
                                    id="position"
                                    name="position"
                                    value={lessonForm.position}
                                    onChange={handleInputChange}
                                    min="1"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Save Lesson
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLessonForm(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboardPage;