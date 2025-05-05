/**
 * Browse Available Courses Page
 * 
 * This page shows courses available for enrollment.
 * Students can view course details and enroll in new courses.
 */

'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Course interface - represents available courses
interface AvailableCourse {
  id: number;
  title: string;
  description: string;
  teacher_name: string | null;
  school_name: string | null;
  status: string;
  difficulty_level: string | null;
  start_date: string | null;
  end_date: string | null;
}

const BrowseCoursesPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<AvailableCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [schools, setSchools] = useState<string[]>([]);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<number | null>(null);

  // Fetch available courses on component mount
  useEffect(() => {
    fetchAvailableCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch available courses that student can enroll in
  const fetchAvailableCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get student ID from localStorage
      const studentId = localStorage.getItem('user-id');
      if (!studentId) {
        router.replace('/auth');
        return;
      }
      
      // Fetch available courses from API
      const response = await fetch(`/api/courses/available?studentId=${studentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user-token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication error
          router.replace('/auth');
          return;
        }
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }
      
      const data = await response.json() as AvailableCourse[];
      
      // Extract unique school names for filtering
      const uniqueSchools = Array.from(new Set(
        data.map(course => course.school_name).filter(Boolean)
      )) as string[];
      
      setCourses(data);
      setSchools(uniqueSchools);
    } catch (err) {
      console.error("Error fetching available courses:", err);
      setError(err instanceof Error ? err.message : 'Failed to load available courses');
    } finally {
      setIsLoading(false);
    }
  };

  // Enroll in a course
  const enrollInCourse = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      
      const studentId = localStorage.getItem('user-id');
      if (!studentId) {
        router.replace('/auth');
        return;
      }
      
      // Call enrollment API
      const response = await fetch('/api/courses/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user-token')}`
        },
        body: JSON.stringify({
          studentId: parseInt(studentId),
          courseId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to enroll: ${response.statusText}`);
      }
      
      // Show success message and remove the course from available list
      setEnrollmentSuccess(courseId);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setEnrollmentSuccess(null);
        setCourses(courses.filter(course => course.id !== courseId));
      }, 3000);
      
    } catch (err) {
      console.error("Error enrolling in course:", err);
      setError(err instanceof Error ? err.message : 'Failed to enroll in course');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  // Return to dashboard
  const goToDashboard = () => {
    router.push('/student-dashboard');
  };

  // Filter courses based on search term and school filter
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSchool = filterSchool === '' || course.school_name === filterSchool;
    
    return matchesSearch && matchesSchool;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Browse Available Courses</h1>
        <button 
          onClick={goToDashboard}
          className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-md"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Success message */}
      {enrollmentSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p>Successfully enrolled in course! Redirecting to dashboard...</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div className="w-full md:w-64">
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Schools</option>
              {schools.map((school, index) => (
                <option key={index} value={school}>{school}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No available courses found matching your criteria.</p>
          </div>
        ) : (
          filteredCourses.map(course => (
            <div 
              key={course.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-3 bg-primary"></div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.description}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Teacher:</span> {course.teacher_name || 'Not assigned'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">School:</span> {course.school_name || 'Not specified'}
                  </p>
                  {course.difficulty_level && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Difficulty:</span> {course.difficulty_level}
                    </p>
                  )}
                  {course.start_date && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Starts:</span> {new Date(course.start_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-xs ${
                    course.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.status}
                  </span>
                  
                  <button
                    onClick={() => enrollInCourse(course.id)}
                    disabled={enrollingCourseId === course.id}
                    className={`${
                      enrollingCourseId === course.id
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-primary hover:bg-secondary'
                    } text-white px-4 py-2 rounded-md transition-colors duration-300`}
                  >
                    {enrollingCourseId === course.id ? 'Enrolling...' : 'Enroll'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrowseCoursesPage;