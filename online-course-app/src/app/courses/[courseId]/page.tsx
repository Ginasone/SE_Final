'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaBook, FaVideo, FaArrowLeft, FaLock } from "react-icons/fa";

interface Lesson {
  id: number;
  title: string;
  content: string;
  video_url: string | null;
  position: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  teacher_name: string | null;
  school_name: string | null;
  status: string;
  start_date: string;
  end_date: string;
}

interface Enrollment {
  id: number;
  status: 'active' | 'completed' | 'dropped';
}

const CourseDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch course details including lessons
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('user-token')}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Handle authentication error
            router.push('/auth');
            return;
          }
          throw new Error(`Failed to fetch course: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Course data:", data); // For debugging
        
        setCourse(data.course);
        setLessons(data.lessons || []);
        setEnrollment(data.enrollment);
        
        // Set first lesson as active if available
        if (data.lessons && data.lessons.length > 0) {
          setActiveLesson(data.lessons[0]);
        }
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  // Handle enrollment
  const handleEnroll = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user-token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to enroll: ${response.statusText}`);
      }

      const data = await response.json();
      setEnrollment(data.enrollment);
      
    } catch (err) {
      console.error("Error enrolling in course:", err);
      setError(err instanceof Error ? err.message : 'Failed to enroll in course');
    } finally {
      setIsLoading(false);
    }
  };

  // Select a lesson to view
  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
  };

  // Go back to dashboard
  const goBack = () => {
    router.push('/student-dashboard');
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
      <div className="min-h-screen p-4 bg-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={goBack}
            className="flex items-center text-primary hover:text-secondary"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No course found
  if (!course) {
    return (
      <div className="min-h-screen p-4 bg-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h1>
          <p className="text-gray-700 mb-6">The course you&apos;re looking for might have been removed or is unavailable.</p>
          <button
            onClick={goBack}
            className="flex items-center text-primary hover:text-secondary"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        {/* Course Header */}
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={goBack}
            className="flex items-center text-primary hover:text-secondary mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{course.title}</h1>
              <p className="text-gray-600 mt-2">{course.description}</p>
              
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-y-1 gap-x-4">
                {course.teacher_name && (
                  <span>Instructor: {course.teacher_name}</span>
                )}
                {course.school_name && (
                  <span>School: {course.school_name}</span>
                )}
                <span className={`px-2 py-1 rounded text-xs ${
                  course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.status}
                </span>
              </div>
            </div>
            
            {!enrollment && (
              <button
                onClick={handleEnroll}
                disabled={isLoading}
                className="bg-primary hover:bg-secondary text-white py-2 px-4 rounded"
              >
                Enroll Now
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {/* Lessons Sidebar */}
          <div className="w-full md:w-1/4 bg-gray-50 p-4 border-r border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Lessons</h2>
            
            {lessons.length === 0 ? (
              <p className="text-gray-500 text-sm">No lessons available yet.</p>
            ) : (
              <ul className="space-y-2">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      onClick={() => selectLesson(lesson)}
                      className={`w-full text-left p-3 rounded flex items-center ${
                        activeLesson?.id === lesson.id
                          ? 'bg-blue-100 text-primary'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {lesson.video_url ? <FaVideo className="mr-2" /> : <FaBook className="mr-2" />}
                      <span className="line-clamp-1">{lesson.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Lesson Content */}
          <div className="w-full md:w-3/4 p-6">
            {!enrollment ? (
              // Not enrolled view
              <div className="text-center py-12">
                <FaLock className="mx-auto text-4xl text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Course Content Locked</h3>
                <p className="text-gray-600 mb-6">You need to enroll in this course to access the lessons.</p>
                <button
                  onClick={handleEnroll}
                  className="bg-primary hover:bg-secondary text-white py-2 px-6 rounded"
                >
                  Enroll Now
                </button>
              </div>
            ) : activeLesson ? (
              // Lesson content view
              <div>
                <h2 className="text-xl font-bold mb-4">{activeLesson.title}</h2>
                
                {activeLesson.video_url && (
                  <div className="aspect-w-16 aspect-h-9 mb-6">
                    <iframe 
                      src={activeLesson.video_url} 
                      className="w-full h-64 md:h-96 border-0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                
                <div className="prose max-w-none">
                  {activeLesson.content ? (
                    <div dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                  ) : (
                    <p className="text-gray-500">No content available for this lesson.</p>
                  )}
                </div>
              </div>
            ) : (
              // No lesson selected
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {lessons.length > 0 
                    ? "Select a lesson from the sidebar to begin learning." 
                    : "No lessons available yet. Check back later."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;