'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight, FaCheck, FaHome, FaVideo } from "react-icons/fa";

interface Lesson {
  id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  position: number;
  completed: boolean;
}

interface Course {
  id: number;
  title: string;
}

interface LessonNavigation {
  prevLessonId: number | null;
  nextLessonId: number | null;
}

const LessonPage = ({ 
  params 
}: { 
  params: { courseId: string; lessonId: string } 
}) => {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [navigation, setNavigation] = useState<LessonNavigation>({
    prevLessonId: null,
    nextLessonId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        const { courseId, lessonId } = params;
        if (!courseId || !lessonId) {
          router.replace('/student-dashboard');
          return;
        }

        // Get auth token
        const token = localStorage.getItem('user-token');
        if (!token) {
          router.replace('/auth');
          return;
        }

        setIsLoading(true);
        setError(null);

        // Fetch lesson details
        const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!lessonResponse.ok) {
          if (lessonResponse.status === 401) {
            router.replace('/auth');
            return;
          }
          throw new Error(`Failed to fetch lesson: ${lessonResponse.statusText}`);
        }

        const lessonData = await lessonResponse.json();

        // Fetch course name for breadcrumb
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!courseResponse.ok) {
          throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
        }

        const courseData = await courseResponse.json();

        // Fetch lesson navigation (prev/next)
        const navResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/navigation`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!navResponse.ok) {
          throw new Error(`Failed to fetch lesson navigation: ${navResponse.statusText}`);
        }

        const navData = await navResponse.json();

        setCourse({
          id: parseInt(courseId),
          title: courseData.title
        });
        setLesson(lessonData);
        setNavigation(navData);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();
  }, [params, router]);

  const markAsCompleted = async () => {
    if (!lesson || lesson.completed || isCompleting) return;

    try {
      setIsCompleting(true);
      const token = localStorage.getItem('user-token');
      
      const response = await fetch(`/api/courses/${params.courseId}/lessons/${params.lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark lesson as completed');
      }

      // Update local state
      setLesson({
        ...lesson,
        completed: true
      });

      // If there's a next lesson, navigate to it after a short delay
      if (navigation.nextLessonId) {
        setTimeout(() => {
          router.push(`/courses/${params.courseId}/lessons/${navigation.nextLessonId}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Error marking lesson as completed:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark lesson as completed');
    } finally {
      setIsCompleting(false);
    }
  };

  const goToCourse = () => {
    router.push(`/courses/${params.courseId}`);
  };

  const goToPreviousLesson = () => {
    if (navigation.prevLessonId) {
      router.push(`/courses/${params.courseId}/lessons/${navigation.prevLessonId}`);
    }
  };

  const goToNextLesson = () => {
    if (navigation.nextLessonId) {
      router.push(`/courses/${params.courseId}/lessons/${navigation.nextLessonId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={goToCourse}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          >
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Lesson Not Found</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">The lesson you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={goToCourse}
            className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded"
          >
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-900 p-4 md:p-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center text-gray-600 dark:text-gray-300">
          <button 
            onClick={goToCourse}
            className="flex items-center hover:text-primary dark:hover:text-blue-400 transition-colors"
          >
            <FaHome className="mr-2" />
            <span className="hidden sm:inline">{course.title}</span>
            <span className="sm:hidden">Course Home</span>
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[150px] sm:max-w-xs">
            Lesson {lesson.position}: {lesson.title}
          </span>
        </div>
        
        {/* Completion Status */}
        {lesson.completed ? (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <FaCheck className="mr-1" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        ) : null}
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {lesson.title}
          </h1>

          {/* Video Content */}
          {lesson.video_url && (
            <div className="mb-8">
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                <iframe 
                  src={lesson.video_url} 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          )}

          {/* Text Content */}
          {lesson.content && (
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}
          
          {/* If neither content nor video */}
          {!lesson.content && !lesson.video_url && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 italic">
                This lesson has no content yet. Please check back later.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation and Completion Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <button
          onClick={goToPreviousLesson}
          disabled={!navigation.prevLessonId}
          className={`flex items-center px-4 py-2 rounded-md ${
            navigation.prevLessonId
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          <FaArrowLeft className="mr-2" />
          Previous Lesson
        </button>

        {!lesson.completed ? (
          <button
            onClick={markAsCompleted}
            disabled={isCompleting}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isCompleting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-secondary'
            }`}
          >
            {isCompleting ? 'Marking...' : 'Mark as Completed'}
          </button>
        ) : (
          <div className="hidden sm:block">
            <span className="flex items-center text-green-600 dark:text-green-400">
              <FaCheck className="mr-1" />
              <span className="text-sm font-medium">Lesson Completed</span>
            </span>
          </div>
        )}

        <button
          onClick={goToNextLesson}
          disabled={!navigation.nextLessonId}
          className={`flex items-center px-4 py-2 rounded-md ${
            navigation.nextLessonId
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Next Lesson
          <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default LessonPage;